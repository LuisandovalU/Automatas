import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Minimize2,
  Play,
  RotateCcw,
  Sparkles,
  StepForward,
  TrainFront,
  XCircle,
} from 'lucide-react';
import {
  DEFAULT_EXERCISE_BUNDLE,
  SolvedMethodBundle,
  traceDfaExecution,
} from '../engine/automataMethodEngine';
import { metroAudio } from '../utils/metroAudio';
import { MetroMapDFA } from './MetroMapDFA';

interface Stage4SimulatorProps {
  bundle?: SolvedMethodBundle;
}

export const Stage4Simulator: React.FC<Stage4SimulatorProps> = ({
  bundle = DEFAULT_EXERCISE_BUNDLE,
}) => {
  const { spec, dfaStartId, dfaOrder, dfaRows, minimizedDfa, testCases, quizQuestions } = bundle;
  const alphabet = spec.alphabet;

  const defaultStr = useMemo(() => {
    const firstValid = testCases.find((t) => t.expectedValid);
    return firstValid?.text ?? alphabet.join('');
  }, [testCases, alphabet]);

  const [inputStr, setInputStr] = useState<string>(defaultStr);
  const [cursor, setCursor] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  // Batch blackboard test lines
  const [batchText, setBatchText] = useState<string>(() =>
    testCases.map((tc) => (tc.text === '' ? 'ε' : tc.text)).join('\n')
  );

  // Hopcroft minimized collapsible
  const [showMinimized, setShowMinimized] = useState<boolean>(true);

  // Quiz state
  const [quizPicked, setQuizPicked] = useState<Record<string, number>>({});

  useEffect(() => {
    const firstValid = bundle.testCases.find((t) => t.expectedValid);
    setInputStr(firstValid?.text ?? bundle.spec.alphabet.join(''));
    setCursor(0);
    setIsAutoPlaying(false);
    setBatchText(bundle.testCases.map((tc) => (tc.text === '' ? 'ε' : tc.text)).join('\n'));
    setQuizPicked({});
  }, [bundle]);

  const trace = useMemo(
    () => traceDfaExecution(bundle, inputStr === 'ε' ? '' : inputStr),
    [bundle, inputStr]
  );

  const safeCursor = Math.min(cursor, Math.max(0, trace.length - 1));
  const currentStep = trace[safeCursor] ?? trace[0];
  const lastStep = trace[trace.length - 1];
  const isFinal = safeCursor === trace.length - 1;
  const finalAccepted =
    lastStep &&
    lastStep.state !== 'INVALID_CHAR' &&
    dfaRows[lastStep.state]?.ef === '1';

  // Auto playback timer
  useEffect(() => {
    if (!isAutoPlaying) return;
    if (safeCursor >= trace.length - 1) {
      setIsAutoPlaying(false);
      if (finalAccepted) metroAudio.playValidExitChime();
      else metroAudio.playDeadEndBuzz();
      return;
    }
    const timer = window.setTimeout(() => {
      setCursor((c) => c + 1);
      metroAudio.playTicketClick();
    }, 650);
    return () => window.clearTimeout(timer);
  }, [isAutoPlaying, safeCursor, trace.length, finalAccepted]);

  // Batch evaluation
  const batchResults = useMemo(() => {
    const lines = batchText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    return lines.map((line) => {
      const clean = line === 'ε' ? '' : line;
      const tr = traceDfaExecution(bundle, clean);
      const end = tr[tr.length - 1];
      const invalidChar = end?.state === 'INVALID_CHAR';
      const accepted =
        !invalidChar && Boolean(end && dfaRows[end.state]?.ef === '1');
      return {
        raw: line,
        clean,
        finalState: end?.state ?? dfaStartId,
        ef: !invalidChar && end ? dfaRows[end.state]?.ef ?? '∅' : '∅',
        invalidChar,
        accepted,
      };
    });
  }, [batchText, bundle, dfaRows, dfaStartId]);

  const handleLoadString = (text: string, autoPlay = false) => {
    setInputStr(text);
    setCursor(0);
    setIsAutoPlaying(autoPlay);
    metroAudio.playTicketClick();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full mb-2">
          <TrainFront className="w-3.5 h-3.5" />
          <span>Lámina 4 · De Tabla a Diagrama Gráfico y Validación</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Capítulo 4: Simulador AFD, Pizarra de Cadenas y Minimización ({spec.title})
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Ya no hay clones ni pasillos ε. El AFD lee un boleto a la vez siguiendo una flecha única por estación.
          Todo estado con <strong className="font-mono">EF = 1</strong> se dibuja con doble círculo verde de aceptación.
        </p>
      </section>

      {/* Main Map + Right Simulator & Final Table */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 space-y-4">
          <MetroMapDFA
            bundle={bundle}
            activeState={
              currentStep?.state === 'INVALID_CHAR' ? null : currentStep?.state ?? dfaStartId
            }
            highlightedEdge={currentStep?.edgeId ?? null}
            caption={currentStep?.narration}
          />

          {/* Compact Final AFD Table (Lámina 4) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Tabla Definitiva del AFD (Lámina 4)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="px-3 py-2 text-left border border-slate-700">Estados</th>
                    {alphabet.map((sym) => (
                      <th key={sym} className="px-3 py-2 text-left border border-slate-700">
                        {sym}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-center border border-slate-700 bg-emerald-900/70">
                      EF
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dfaOrder.map((id) => {
                    const row = dfaRows[id];
                    if (!row) return null;
                    const isHere = currentStep?.state === id;
                    return (
                      <tr
                        key={id}
                        className={
                          isHere
                            ? 'bg-orange-100/70 font-semibold'
                            : row.isDeadEnd
                            ? 'bg-rose-50/40'
                            : 'hover:bg-slate-50'
                        }
                      >
                        <td className="px-3 py-2 border border-slate-200 font-mono">
                          {id}{' '}
                          {row.isStart && (
                            <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 ml-1">
                              Inicio
                            </span>
                          )}
                        </td>
                        {alphabet.map((sym) => (
                          <td key={sym} className="px-3 py-2 border border-slate-200 font-mono">
                            {row.transitions[sym]}
                          </td>
                        ))}
                        <td className="px-3 py-2 border border-slate-200 text-center font-mono font-bold">
                          <span
                            className={
                              row.ef === '1'
                                ? 'px-2 py-0.5 rounded bg-emerald-600 text-white'
                                : 'text-slate-400'
                            }
                          >
                            {row.ef}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Single String Player + Blackboard Batch Validator */}
        <div className="xl:col-span-5 space-y-5">
          {/* Interactive Single String Runner */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Probador Paso a Paso</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Escribe una cadena o elige un ejemplo de la pizarra para seguir al tren en el mapa.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {testCases.map((tc) => (
                <button
                  key={tc.label}
                  onClick={() => handleLoadString(tc.text, true)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold border transition-colors ${
                    inputStr === tc.text
                      ? 'bg-slate-900 text-white border-slate-900'
                      : tc.expectedValid
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                  }`}
                  title={tc.reason}
                >
                  {tc.expectedValid ? '✓' : '✗'} {tc.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputStr}
                onChange={(e) => handleLoadString(e.target.value, false)}
                placeholder="Escribe cadena o deja vacío para ε..."
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <div className="flex items-center gap-1">
                {alphabet.map((sym) => (
                  <button
                    key={sym}
                    onClick={() => handleLoadString(inputStr + sym, false)}
                    className="px-2.5 py-2 rounded-lg text-xs font-mono font-bold bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100"
                  >
                    +{sym}
                  </button>
                ))}
              </div>
            </div>

            {/* Step chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {trace.map((st, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCursor(idx);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold border shrink-0 ${
                    safeCursor === idx
                      ? 'bg-orange-600 text-white border-orange-600'
                      : idx < safeCursor
                      ? 'bg-orange-50 text-orange-800 border-orange-200'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {st.symbol}
                </button>
              ))}
            </div>

            {/* Current Step Narration */}
            {currentStep && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>
                    Paso {safeCursor} de {trace.length - 1}
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    Estado:{' '}
                    {currentStep.state === 'INVALID_CHAR' ? 'ERROR (Σ)' : currentStep.state}
                  </span>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed">{currentStep.narration}</p>

                {isFinal && (
                  <div
                    className={`flex items-center gap-2 pt-2 border-t border-slate-200 font-bold text-xs ${
                      finalAccepted ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {finalAccepted ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>CADENA ACEPTADA · Llegó a {lastStep.state} (EF = 1)</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>
                          CADENA RECHAZADA ·{' '}
                          {lastStep.state === 'INVALID_CHAR'
                            ? 'Contiene un carácter fuera de Σ'
                            : `Terminó en ${lastStep.state} (EF = ∅)`}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCursor(0);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Inicio</span>
              </button>
              <button
                onClick={() => {
                  setIsAutoPlaying(false);
                  if (safeCursor < trace.length - 1) {
                    const next = safeCursor + 1;
                    setCursor(next);
                    if (next === trace.length - 1) {
                      if (finalAccepted) metroAudio.playValidExitChime();
                      else metroAudio.playDeadEndBuzz();
                    } else {
                      metroAudio.playTicketClick();
                    }
                  }
                }}
                disabled={isFinal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40"
              >
                <StepForward className="w-3.5 h-3.5" />
                <span>Paso</span>
              </button>
              <button
                onClick={() => {
                  if (isFinal) setCursor(0);
                  setIsAutoPlaying((v) => !v);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-orange-600 text-white hover:bg-orange-700"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isAutoPlaying ? 'Pausar tren' : 'Animar viaje'}</span>
              </button>
            </div>
          </div>

          {/* Blackboard Batch Checker (Lámina 4 Estilo Pizarra) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Pizarra de Pruebas en Lote (Lámina 4)
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Escribe una cadena por línea (usa <span className="font-mono font-bold">ε</span> para cadena vacía) para validar todas al instante:
            </p>
            <textarea
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {batchResults.map((res, idx) => (
                <div
                  key={`${res.raw}-${idx}`}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold shrink-0 ${
                        res.accepted
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {res.accepted ? 'VÁLIDA' : 'RECHAZADA'}
                    </span>
                    <span className="font-mono font-semibold text-slate-900 truncate">
                      {res.raw}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[11px] text-slate-500">
                      → {res.invalidChar ? 'Fuera Σ' : `${res.finalState} (EF=${res.ef})`}
                    </span>
                    <button
                      onClick={() => handleLoadString(res.clean, true)}
                      className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 font-semibold text-[11px]"
                    >
                      Animar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bonus Step: Hopcroft Minimized DFA */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-3">
        <button
          onClick={() => setShowMinimized((v) => !v)}
          className="w-full flex items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-2.5">
            <Minimize2 className="w-4 h-4 text-sky-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Paso Bonus · Minimización de Hopcroft ({dfaOrder.length} →{' '}
                {minimizedDfa.states.length} estados)
              </h3>
              <p className="text-xs text-slate-500">{minimizedDfa.summary}</p>
            </div>
          </div>
          {showMinimized ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showMinimized && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 space-y-2 text-xs">
              <div className="font-semibold text-slate-800">
                Refinamiento de Particiones (EF=1 vs EF=∅):
              </div>
              <div className="space-y-1.5">
                {minimizedDfa.partitionsHistory.map((part, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 font-mono text-[11px] text-slate-800"
                  >
                    <span className="font-sans font-bold text-slate-500 mr-2">P{idx}:</span>
                    {part.join('  |  ')}
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-sky-900 text-white">
                    <th className="px-3 py-2 text-left border border-sky-800">Estado Mínimo</th>
                    <th className="px-3 py-2 text-left border border-sky-800">Agrupa a</th>
                    {alphabet.map((sym) => (
                      <th key={sym} className="px-3 py-2 text-left border border-sky-800">
                        {sym}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-center border border-sky-800">EF</th>
                  </tr>
                </thead>
                <tbody>
                  {minimizedDfa.states.map((ms) => (
                    <tr key={ms.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 border border-slate-200 font-mono font-bold text-slate-900">
                        {ms.id}
                        {ms.isStart && (
                          <span className="ml-1.5 text-[10px] font-sans px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Inicio
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 border border-slate-200 font-mono text-[11px] text-slate-600">
                        {ms.originalIds.join(', ')}
                      </td>
                      {alphabet.map((sym) => (
                        <td key={sym} className="px-3 py-2 border border-slate-200 font-mono">
                          {ms.transitions[sym]}
                        </td>
                      ))}
                      <td className="px-3 py-2 border border-slate-200 text-center font-mono font-bold">
                        <span
                          className={
                            ms.ef === '1'
                              ? 'px-2 py-0.5 rounded bg-emerald-600 text-white'
                              : 'text-slate-400'
                          }
                        >
                          {ms.ef}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Auto-generated Quiz Section */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sparkles className="w-4 h-4 text-orange-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Mini-Quiz de Examen ({spec.title})
            </h3>
            <p className="text-xs text-slate-500">
              Preguntas generadas automáticamente sobre este autómata para validar tu dominio del método.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizQuestions.map((q, qIdx) => {
            const picked = quizPicked[q.id];
            const answered = picked !== undefined;
            const isCorrect = picked === q.correctIndex;

            return (
              <div
                key={q.id}
                className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/40"
              >
                <div className="text-sm font-semibold text-slate-900">
                  {qIdx + 1}. {q.prompt}
                </div>

                <div className="space-y-1.5">
                  {q.options.map((opt, oIdx) => {
                    const isRightOpt = oIdx === q.correctIndex;
                    const isPickedOpt = oIdx === picked;
                    let cls =
                      'bg-white border-slate-200 text-slate-700 hover:bg-slate-100';
                    if (answered) {
                      if (isRightOpt) {
                        cls = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold';
                      } else if (isPickedOpt) {
                        cls = 'bg-rose-50 border-rose-400 text-rose-900';
                      } else {
                        cls = 'bg-white border-slate-200 text-slate-400';
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => {
                          setQuizPicked((prev) => ({ ...prev, [q.id]: oIdx }));
                          if (oIdx === q.correctIndex) metroAudio.playValidExitChime();
                          else metroAudio.playDeadEndBuzz();
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors ${cls}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {answered && (
                  <div
                    className={`flex items-start gap-2 text-xs pt-2 border-t border-slate-200 ${
                      isCorrect ? 'text-emerald-900' : 'text-rose-900'
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span>{q.explanation}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
