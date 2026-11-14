import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { MetroMapNFA } from './MetroMapNFA';
import { IMAGE2_TABLE, Image2Row, NFA_STATIONS, NfaState } from '../data/automataData';
import { metroAudio } from '../utils/metroAudio';

const ALL_STATES: NfaState[] = ['A', 'B', 'C', 'D', 'E', 'F'];

type StepField = 'epsilonC' | 'deltaA' | 'epsilonCA' | 'deltaB' | 'epsilonCB' | 'efNew';

interface TableStepDef {
  index: number;
  state: NfaState;
  field: StepField;
  label: string;
}

const STEP_FIELDS: { field: StepField; label: string }[] = [
  { field: 'epsilonC', label: '1. ε-C' },
  { field: 'deltaA', label: '2. δ(x, a)' },
  { field: 'epsilonCA', label: '3. ε-C → AFN(a)' },
  { field: 'deltaB', label: '2. δ(x, b)' },
  { field: 'epsilonCB', label: '3. ε-C → AFN(b)' },
  { field: 'efNew', label: 'EF nuevo' },
];

const ALL_STEPS: TableStepDef[] = IMAGE2_TABLE.flatMap((row, rIdx) =>
  STEP_FIELDS.map((sf, cIdx) => ({
    index: rIdx * STEP_FIELDS.length + cIdx,
    state: row.state,
    field: sf.field,
    label: sf.label,
  }))
);

const SET_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'C,D,F', 'E,D,F', '∅'];
const EF_OPTIONS = ['∅', '1'];

function cellKey(state: NfaState, field: StepField): string {
  return `${state}:${field}`;
}

export const Stage2Closure: React.FC<{ onNextStage: () => void }> = ({ onNextStage }) => {
  const [targetStation, setTargetStation] = useState<NfaState>('C');
  const [userPick, setUserPick] = useState<NfaState[]>(['C']);
  const [checkedClosure, setCheckedClosure] = useState<boolean | null>(null);

  // Interactive table filling state
  const [tableMode, setTableMode] = useState<'guided' | 'practice'>('guided');
  // Start with Row A & B pre-guided or at step 12 (Row C step 1) — actually starting at step 1 (Row A step 1) or 0 makes the step-by-step discovery super clear! Let's start at step 1 (A: ε-C) so the arrow pipeline is immediately visible and alive.
  const [guidedStepCount, setGuidedStepCount] = useState<number>(1);
  const [practiceValues, setPracticeValues] = useState<Record<string, string>>({});
  const [focusedStepIdx, setFocusedStepIdx] = useState<number>(0);

  const targetMeta = NFA_STATIONS[targetStation];

  const handleSelectStationForGame = (st: NfaState) => {
    setTargetStation(st);
    setUserPick([st]);
    setCheckedClosure(null);
    metroAudio.playTicketClick();
  };

  const togglePick = (st: NfaState) => {
    setCheckedClosure(null);
    metroAudio.playTicketClick();
    setUserPick((prev) =>
      prev.includes(st) ? prev.filter((item) => item !== st) : [...prev, st]
    );
  };

  const verifyClosure = () => {
    const expected = [...targetMeta.epsilonClosure].sort().join(',');
    const got = [...userPick].sort().join(',');
    const ok = expected === got;
    setCheckedClosure(ok);
    if (ok) metroAudio.playValidExitChime();
    else metroAudio.playDeadEndBuzz();
  };

  const activeStepDef = ALL_STEPS[Math.min(focusedStepIdx, ALL_STEPS.length - 1)];
  const activeRowData: Image2Row =
    IMAGE2_TABLE.find((r) => r.state === activeStepDef.state) ?? IMAGE2_TABLE[0];

  const isCellRevealedInGuided = (state: NfaState, field: StepField): boolean => {
    const idx = ALL_STEPS.findIndex((s) => s.state === state && s.field === field);
    return idx < guidedStepCount;
  };

  const handleNextGuidedStep = () => {
    const nextCount = Math.min(ALL_STEPS.length, guidedStepCount + 1);
    setGuidedStepCount(nextCount);
    setFocusedStepIdx(Math.max(0, nextCount - 1));
    const justFilled = ALL_STEPS[nextCount - 1];
    if (justFilled) {
      const row = IMAGE2_TABLE.find((r) => r.state === justFilled.state)!;
      if (justFilled.field === 'efNew' && row.efNew === '1') {
        metroAudio.playValidExitChime();
      } else if (row[justFilled.field] === '∅') {
        metroAudio.playTicketClick();
      } else {
        metroAudio.playTransferChime();
      }
    }
  };

  const handlePrevGuidedStep = () => {
    const nextCount = Math.max(1, guidedStepCount - 1);
    setGuidedStepCount(nextCount);
    setFocusedStepIdx(Math.max(0, nextCount - 1));
    metroAudio.playTicketClick();
  };

  const handleFillRow = (state: NfaState) => {
    const rowIdx = IMAGE2_TABLE.findIndex((r) => r.state === state);
    const endOfRowCount = (rowIdx + 1) * STEP_FIELDS.length;
    setGuidedStepCount((prev) => Math.max(prev, endOfRowCount));
    setFocusedStepIdx(endOfRowCount - 1);
    metroAudio.playTransferChime();
  };

  const handleFillAll = () => {
    if (tableMode === 'guided') {
      setGuidedStepCount(ALL_STEPS.length);
      setFocusedStepIdx(ALL_STEPS.length - 1);
    } else {
      const all: Record<string, string> = {};
      IMAGE2_TABLE.forEach((r) => {
        STEP_FIELDS.forEach((sf) => {
          all[cellKey(r.state, sf.field)] = r[sf.field];
        });
      });
      setPracticeValues(all);
    }
    metroAudio.playValidExitChime();
  };

  const handleResetTable = () => {
    if (tableMode === 'guided') {
      setGuidedStepCount(1);
      setFocusedStepIdx(0);
    } else {
      setPracticeValues({});
      setFocusedStepIdx(0);
    }
    metroAudio.playTicketClick();
  };

  const practiceCorrectCount = useMemo(() => {
    let count = 0;
    IMAGE2_TABLE.forEach((r) => {
      STEP_FIELDS.forEach((sf) => {
        if (practiceValues[cellKey(r.state, sf.field)] === r[sf.field]) count++;
      });
    });
    return count;
  }, [practiceValues]);

  // Map highlights driven by activeStepDef
  const mapHighlights = useMemo(() => {
    const edges: string[] = [];
    let states: NfaState[] = [activeStepDef.state];
    const st = activeStepDef.state;
    const fld = activeStepDef.field;

    if (st === 'C') {
      edges.push('C-e-D', 'C-e-F');
      if (fld === 'epsilonC' || fld === 'efNew') {
        states = ['C', 'D', 'F'];
      } else if (fld === 'deltaA') {
        edges.push('D-a-E');
        states = ['E'];
      } else if (fld === 'epsilonCA') {
        edges.push('D-a-E', 'E-e-D', 'E-e-F');
        states = ['E', 'D', 'F'];
      } else {
        states = ['C', 'D', 'F'];
      }
    } else if (st === 'E') {
      edges.push('E-e-D', 'E-e-F');
      if (fld === 'epsilonC' || fld === 'efNew') {
        states = ['E', 'D', 'F'];
      } else if (fld === 'deltaA' || fld === 'epsilonCA') {
        edges.push('D-a-E');
        states = ['E', 'D', 'F'];
      }
    } else if (st === 'A') {
      if (fld === 'deltaA' || fld === 'epsilonCA') {
        edges.push('A-a-B');
        states = ['B'];
      }
    } else if (st === 'B') {
      if (fld === 'deltaB') {
        edges.push('B-b-C');
        states = ['C'];
      } else if (fld === 'epsilonCB') {
        edges.push('B-b-C', 'C-e-D', 'C-e-F');
        states = ['C', 'D', 'F'];
      }
    } else if (st === 'D') {
      if (fld === 'deltaA') {
        edges.push('D-a-E');
        states = ['E'];
      } else if (fld === 'epsilonCA') {
        edges.push('D-a-E', 'E-e-D', 'E-e-F');
        states = ['E', 'D', 'F'];
      }
    }
    return { states, edges };
  }, [activeStepDef]);

  // Arrow pipeline content for the active step
  const arrowPipeline = useMemo(() => {
    const row = activeRowData;
    const f = activeStepDef.field;

    if (f === 'efNew') {
      return {
        modeTitle: `¿Por qué EF nuevo = ${row.efNew} en la estación ${row.state}?`,
        activeBoxIndex: 3,
        steps: [
          {
            boxTitle: 'Estación inicial',
            value: row.state,
            arrowLabel: '1. Camina gratis (ε-C)',
            arrowSub: 'Sin pagar boletos',
          },
          {
            boxTitle: 'Alcance gratis',
            value: `{${row.epsilonC}}`,
            arrowLabel: '2. ¿Está la salida F?',
            arrowSub: row.efNew === '1' ? 'F sí está incluida' : 'F no está aquí',
          },
          {
            boxTitle: 'Regla de salida',
            value: row.efNew === '1' ? 'Sí llega a F' : 'No llega a F',
            arrowLabel: '3. Nuevo EF',
            arrowSub: 'Resultado final',
          },
          {
            boxTitle: 'EF nuevo',
            value: row.efNew,
            arrowLabel: '',
            arrowSub: '',
          },
        ],
        explanation: row.whyEF,
      };
    }

    const isBChain = f === 'deltaB' || f === 'epsilonCB';
    const ticket = isBChain ? 'b' : 'a';
    const deltaVal = isBChain ? row.deltaB : row.deltaA;
    const finalVal = isBChain ? row.epsilonCB : row.epsilonCA;

    const activeBoxIndex =
      f === 'epsilonC' ? 1 : f === 'deltaA' || f === 'deltaB' ? 2 : 3;

    return {
      modeTitle: `Flujo con flechas · Fila ${row.state} · ${
        f === 'epsilonC' ? 'Paso 1: Transbordo inicial' : `Boleto "${ticket}"`
      }`,
      activeBoxIndex,
      steps: [
        {
          boxTitle: 'Andén actual',
          value: row.state,
          arrowLabel: '1. Camina gratis (ε-C)',
          arrowSub: '¿Dónde apareces sin pagar?',
        },
        {
          boxTitle: '1. ε-C(x)',
          value: `{${row.epsilonC}}`,
          arrowLabel: `2. Paga boleto "${ticket}"`,
          arrowSub: `¿Quién tiene tren "${ticket}"?`,
        },
        {
          boxTitle: `2. δ(x, ${ticket})`,
          value: deltaVal === '∅' ? '∅ (ninguno)' : `{${deltaVal}}`,
          arrowLabel: '3. Camina gratis al bajar',
          arrowSub: 'ε-C del destino',
        },
        {
          boxTitle: `3. AFN(${ticket})`,
          value: finalVal === '∅' ? '∅' : `{${finalVal}}`,
          arrowLabel: '',
          arrowSub: '',
        },
      ],
      explanation: isBChain ? row.whyB : row.whyA,
    };
  }, [activeRowData, activeStepDef.field]);

  const progressCurrent = tableMode === 'guided' ? guidedStepCount : practiceCorrectCount;

  return (
    <div className="space-y-8">
      {/* Header card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="text-xs font-medium text-slate-500">
          Capítulo 2 · El alcance del transbordo gratis (ε-Cerradura) · Imagen 2
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mt-1 text-balance">
          Llena la tabla paso a paso siguiendo las flechas
        </h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-4xl">
          Para eliminar los pasillos invisibles <span className="font-mono font-semibold text-sky-700">ε</span>, cada
          fila se llena siempre en cadena de 3 pasos:{' '}
          <strong className="text-slate-900">1. Camina gratis (ε-C)</strong> →{' '}
          <strong className="text-slate-900">2. Toma el tren (a o b)</strong> →{' '}
          <strong className="text-slate-900">3. Vuelve a caminar gratis al bajar (ε-C)</strong>.
        </p>
      </div>

      {/* Top Two-Zone: Map + Closure Mini-Game */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <MetroMapNFA
            activeStates={mapHighlights.states}
            highlightedTransitions={mapHighlights.edges}
            selectedStation={targetStation}
            onSelectStation={handleSelectStationForGame}
            showNewAccepts={true}
            caption="Al avanzar en la tabla inferior, el mapa resalta el recorrido exacto de las flechas."
          />
        </div>

        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Reto rápido: Calcula ε-C(x)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Elige una estación y marca todos los andenes a los que llegas caminando SIN pagar boleto.
            </p>
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            {ALL_STATES.map((st) => (
              <button
                key={st}
                onClick={() => handleSelectStationForGame(st)}
                className={`py-2 rounded-lg text-sm font-mono font-semibold border transition-colors ${
                  targetStation === st
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-700 font-medium">
            Si estás en <span className="font-mono font-bold text-slate-900">{targetStation}</span> ({targetMeta.metroName}), ¿cuáles estaciones forman su ε-C?
          </div>

          <div className="grid grid-cols-3 gap-2">
            {ALL_STATES.map((st) => {
              const picked = userPick.includes(st);
              return (
                <button
                  key={st}
                  onClick={() => togglePick(st)}
                  className={`py-2 px-3 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                    picked
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {picked ? `✓ ${st}` : st}
                </button>
              );
            })}
          </div>

          <button
            onClick={verifyClosure}
            className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold bg-orange-600 text-white hover:bg-orange-700 transition-colors"
          >
            Comprobar alcance gratis
          </button>

          {checkedClosure !== null && (
            <div
              className={`rounded-lg p-3.5 text-xs leading-relaxed border ${
                checkedClosure
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="font-semibold mb-1">
                {checkedClosure
                  ? `¡Exacto! ε-C(${targetStation}) = {${targetMeta.epsilonClosure.join(', ')}}`
                  : `Casi — revisa las flechas azules (ε) que salen de ${targetStation}.`}
              </div>
              <p>{targetMeta.closureReason}</p>
            </div>
          )}
        </div>
      </section>

      {/* Interactive Step-by-Step Table Builder + Visual Arrow Flow */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Tabla Interactiva Paso a Paso: De AFN-ε a AFN (Imagen 2)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              Progreso: {progressCurrent} de {ALL_STEPS.length} celdas completadas · Haz clic en cualquier celda para ver sus flechas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Mode switch */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => {
                  setTableMode('guided');
                  metroAudio.playTicketClick();
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  tableMode === 'guided'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Modo Guiado
              </button>
              <button
                onClick={() => {
                  setTableMode('practice');
                  metroAudio.playTicketClick();
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  tableMode === 'practice'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Modo Práctica (Llenar yo)
              </button>
            </div>

            <button
              onClick={handleResetTable}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>

            <button
              onClick={handleFillAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Completar tabla</span>
            </button>
          </div>
        </div>

        {/* Guided playback controls bar */}
        {tableMode === 'guided' && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
            <div className="text-xs text-slate-700">
              <span className="font-semibold text-slate-900">Paso activo: </span>
              Fila <span className="font-mono font-bold text-orange-700">{activeStepDef.state}</span> →{' '}
              <span className="font-mono font-semibold">{activeStepDef.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevGuidedStep}
                disabled={guidedStepCount <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 whitespace-nowrap"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
              <button
                onClick={handleNextGuidedStep}
                disabled={guidedStepCount >= ALL_STEPS.length}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-40 whitespace-nowrap"
              >
                <span>Llenar siguiente celda</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* VISUAL ARROW FLOW DIAGRAM explaining WHY */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-orange-600" />
              <span>{arrowPipeline.modeTitle}</span>
            </div>
            <span className="text-xs text-slate-500">
              Sigue las flechas de izquierda a derecha para ver de dónde sale el valor
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center">
            {arrowPipeline.steps.map((step, idx) => {
              const isHighlightedBox = idx === arrowPipeline.activeBoxIndex;
              return (
                <React.Fragment key={idx}>
                  <div
                    className={`rounded-lg border p-3 text-center transition-colors ${
                      isHighlightedBox
                        ? 'bg-orange-600 border-orange-700 text-white'
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <div
                      className={`text-[11px] font-medium ${
                        isHighlightedBox ? 'text-orange-100' : 'text-slate-500'
                      }`}
                    >
                      {step.boxTitle}
                    </div>
                    <div className="font-mono text-sm sm:text-base font-bold mt-1">
                      {step.value}
                    </div>
                  </div>

                  {idx < arrowPipeline.steps.length - 1 && (
                    <div className="flex flex-col items-center justify-center text-center py-1">
                      <div className="text-[11px] font-semibold text-sky-800 leading-tight">
                        {step.arrowLabel}
                      </div>
                      <ArrowRight className="w-5 h-5 text-orange-600 my-0.5 rotate-90 md:rotate-0" />
                      <div className="text-[10px] text-slate-500 leading-tight">
                        {step.arrowSub}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3.5 text-sm text-slate-800 leading-relaxed">
            <span className="font-semibold text-slate-900">¿Por qué da eso? </span>
            {arrowPipeline.explanation}
          </div>
        </div>

        {/* The Interactive Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left border-collapse text-xs sm:text-sm tabular-nums">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-2.5 px-3 font-semibold">Estación</th>
                <th className="py-2.5 px-3 font-semibold font-mono text-sky-800">1. ε-C →</th>
                <th className="py-2.5 px-3 font-semibold font-mono">2. δ(x, a) →</th>
                <th className="py-2.5 px-3 font-semibold font-mono text-orange-800">3. ε-C → AFN(a)</th>
                <th className="py-2.5 px-3 font-semibold font-mono">2. δ(x, b) →</th>
                <th className="py-2.5 px-3 font-semibold font-mono text-orange-800">3. ε-C → AFN(b)</th>
                <th className="py-2.5 px-3 font-semibold font-mono">EF orig.</th>
                <th className="py-2.5 px-3 font-semibold font-mono text-emerald-800">EF nuevo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {IMAGE2_TABLE.map((row) => {
                const isSelectedRow = activeStepDef.state === row.state;
                const efChanged = row.efOriginal !== row.efNew;

                const renderCell = (field: StepField, options: string[], accentClass: string) => {
                  const stepObj = ALL_STEPS.find((s) => s.state === row.state && s.field === field)!;
                  const isFocused = focusedStepIdx === stepObj.index;
                  const truthVal = row[field];

                  if (tableMode === 'guided') {
                    const revealed = isCellRevealedInGuided(row.state, field);
                    return (
                      <td className="py-2 px-2.5">
                        <button
                          onClick={() => {
                            if (!revealed) {
                              setGuidedStepCount(stepObj.index + 1);
                            }
                            setFocusedStepIdx(stepObj.index);
                            metroAudio.playTicketClick();
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded border text-xs transition-colors ${
                            !revealed
                              ? 'bg-slate-50 border-dashed border-slate-300 text-slate-400 hover:border-orange-400 hover:text-orange-700'
                              : isFocused
                              ? 'bg-orange-600 border-orange-700 text-white font-semibold'
                              : accentClass
                          }`}
                        >
                          {revealed ? `${truthVal}${field === 'efNew' && efChanged ? ' ★' : ''}` : '?'}
                        </button>
                      </td>
                    );
                  }

                  // Practice mode
                  const k = cellKey(row.state, field);
                  const val = practiceValues[k] || '';
                  const isCorrect = val === truthVal;

                  return (
                    <td className="py-2 px-2">
                      <select
                        value={val}
                        onFocus={() => setFocusedStepIdx(stepObj.index)}
                        onChange={(e) => {
                          const nextVal = e.target.value;
                          setFocusedStepIdx(stepObj.index);
                          setPracticeValues((prev) => ({ ...prev, [k]: nextVal }));
                          if (nextVal === truthVal) metroAudio.playTransferChime();
                          else if (nextVal !== '') metroAudio.playDeadEndBuzz();
                        }}
                        aria-label={`Fila ${row.state} columna ${field}`}
                        className={`w-full px-2 py-1.5 rounded border text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          val === ''
                            ? 'bg-white border-slate-300 text-slate-500'
                            : isCorrect
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                            : 'bg-rose-50 border-rose-400 text-rose-900'
                        }`}
                      >
                        <option value="">?</option>
                        {options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                };

                return (
                  <tr
                    key={row.state}
                    className={isSelectedRow ? 'bg-orange-50/40' : 'hover:bg-slate-50'}
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center justify-between gap-2">
                        <span>{row.state}</span>
                        {tableMode === 'guided' && (
                          <button
                            onClick={() => handleFillRow(row.state)}
                            title={`Completar fila ${row.state}`}
                            className="text-[10px] font-sans font-medium text-slate-500 hover:text-orange-700 underline"
                          >
                            llenar
                          </button>
                        )}
                      </div>
                    </td>
                    {renderCell('epsilonC', SET_OPTIONS, 'bg-sky-50 border-sky-200 text-sky-900 hover:bg-sky-100')}
                    {renderCell('deltaA', SET_OPTIONS, 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100')}
                    {renderCell('epsilonCA', SET_OPTIONS, 'bg-orange-50 border-orange-200 text-orange-900 hover:bg-orange-100')}
                    {renderCell('deltaB', SET_OPTIONS, 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100')}
                    {renderCell('epsilonCB', SET_OPTIONS, 'bg-orange-50 border-orange-200 text-orange-900 hover:bg-orange-100')}
                    <td className="py-2.5 px-3 text-slate-500">{row.efOriginal}</td>
                    {renderCell(
                      'efNew',
                      EF_OPTIONS,
                      row.efNew === '1'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold hover:bg-emerald-100'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Regla de oro del EF nuevo:</strong> Si en el Paso 1 (ε-C) puedes caminar gratis hasta{' '}
              <span className="font-mono font-semibold">F</span>, esa fila hereda salida válida (<span className="font-mono font-semibold">1</span>).
            </span>
          </div>
          <button
            onClick={onNextStage}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <span>Ir al Capítulo 3: Súper-Andenes (AFD)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
};
