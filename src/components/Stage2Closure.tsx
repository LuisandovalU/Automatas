import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  GraduationCap,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Table2,
  XCircle,
} from 'lucide-react';
import {
  DEFAULT_EXERCISE_BUNDLE,
  SolvedMethodBundle,
  Stage2RowDynamic,
} from '../engine/automataMethodEngine';
import { metroAudio } from '../utils/metroAudio';
import { MetroMapNFA } from './MetroMapNFA';

interface Stage2ClosureProps {
  bundle?: SolvedMethodBundle;
  onNextStage: () => void;
}

type CellFocus = {
  state: string;
  symbol: string;
};

export const Stage2Closure: React.FC<Stage2ClosureProps> = ({
  bundle = DEFAULT_EXERCISE_BUNDLE,
  onNextStage,
}) => {
  const { spec, stations, stage2Rows, candidateSets } = bundle;
  const alphabet = spec.alphabet;
  const firstSym = alphabet[0] ?? 'a';

  const [mode, setMode] = useState<'guided' | 'practice'>('guided');
  const [showNewAcceptsOnMap, setShowNewAcceptsOnMap] = useState(true);
  const [focus, setFocus] = useState<CellFocus>({
    state: spec.startState,
    symbol: firstSym,
  });

  // Mini-game: ε-C(x) builder
  const [miniState, setMiniState] = useState<string>(spec.startState);
  const [miniPicked, setMiniPicked] = useState<string[]>([spec.startState]);
  const [miniChecked, setMiniChecked] = useState<boolean>(false);

  // Practice mode answers: key = `${state}|${sym}|delta` or `closure` or `efNew`
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string>>({});
  const [practiceVerified, setPracticeVerified] = useState(false);

  const [showSummaryTable, setShowSummaryTable] = useState(true);

  // Reset state whenever active exercise changes
  useEffect(() => {
    setFocus({
      state: bundle.spec.startState,
      symbol: bundle.spec.alphabet[0] ?? 'a',
    });
    setMiniState(bundle.spec.startState);
    setMiniPicked([bundle.spec.startState]);
    setMiniChecked(false);
    setPracticeAnswers({});
    setPracticeVerified(false);
  }, [bundle.spec.id, bundle.spec.startState, bundle.spec.alphabet]);

  const rowByState = useMemo(() => {
    const map: Record<string, Stage2RowDynamic> = {};
    for (const r of stage2Rows) map[r.state] = r;
    return map;
  }, [stage2Rows]);

  const activeRow = rowByState[focus.state] ?? stage2Rows[0];
  const activeSymbol = alphabet.includes(focus.symbol) ? focus.symbol : firstSym;
  const activeCell = activeRow?.bySymbol[activeSymbol];

  // Highlights on MetroMapNFA matching the currently inspected arrow pipeline
  const mapHighlights = useMemo(() => {
    if (!activeRow || !activeCell) {
      return { activeStates: [] as string[], transitions: [] as string[] };
    }
    const activeSet = new Set<string>([
      activeRow.state,
      ...activeRow.epsilonCList,
      ...activeCell.deltaList,
      ...activeCell.closureList,
    ]);

    const epsSeeds = new Set<string>([activeRow.state, ...activeCell.deltaList]);
    const closurePool = new Set<string>([...activeRow.epsilonCList, ...activeCell.closureList]);
    const deltaSet = new Set<string>(activeCell.deltaList);
    const epsStartSet = new Set<string>(activeRow.epsilonCList);

    const trIds: string[] = [];
    for (const tr of spec.transitions) {
      if (
        tr.label === activeSymbol &&
        epsStartSet.has(tr.from) &&
        deltaSet.has(tr.to)
      ) {
        trIds.push(tr.id);
      } else if (
        tr.label === 'ε' &&
        (epsSeeds.has(tr.from) || closurePool.has(tr.from)) &&
        closurePool.has(tr.to)
      ) {
        trIds.push(tr.id);
      }
    }

    return {
      activeStates: Array.from(activeSet),
      transitions: trIds,
    };
  }, [activeRow, activeCell, activeSymbol, spec.transitions]);

  // Mini-game handlers
  const targetMiniRow = rowByState[miniState] ?? stage2Rows[0];
  const miniExpected = targetMiniRow ? targetMiniRow.epsilonCList : [];
  const miniIsCorrect =
    miniChecked &&
    miniPicked.length === miniExpected.length &&
    miniExpected.every((s) => miniPicked.includes(s));

  const toggleMiniPick = (st: string) => {
    setMiniChecked(false);
    setMiniPicked((prev) =>
      prev.includes(st) ? prev.filter((x) => x !== st) : [...prev, st]
    );
  };

  const handleCheckMini = () => {
    setMiniChecked(true);
    const ok =
      miniPicked.length === miniExpected.length &&
      miniExpected.every((s) => miniPicked.includes(s));
    if (ok) metroAudio.playValidExitChime();
    else metroAudio.playDeadEndBuzz();
  };

  // Practice dropdown options
  const practiceSetOptions = useMemo(() => {
    const opts = new Set<string>(['∅']);
    for (const r of stage2Rows) {
      opts.add(r.epsilonC);
      for (const sym of alphabet) {
        opts.add(r.bySymbol[sym].delta);
        opts.add(r.bySymbol[sym].closure);
      }
    }
    for (const cs of candidateSets) opts.add(cs);
    return Array.from(opts);
  }, [stage2Rows, alphabet, candidateSets]);

  const practiceStats = useMemo(() => {
    let total = 0;
    let correct = 0;
    for (const r of stage2Rows) {
      for (const sym of alphabet) {
        total += 2;
        if (practiceAnswers[`${r.state}|${sym}|delta`] === r.bySymbol[sym].delta) correct++;
        if (practiceAnswers[`${r.state}|${sym}|closure`] === r.bySymbol[sym].closure) correct++;
      }
      total += 1;
      if (practiceAnswers[`${r.state}|efNew`] === r.efNew) correct++;
    }
    return { total, correct };
  }, [stage2Rows, alphabet, practiceAnswers]);

  const handleAutoFillPractice = () => {
    const filled: Record<string, string> = {};
    for (const r of stage2Rows) {
      for (const sym of alphabet) {
        filled[`${r.state}|${sym}|delta`] = r.bySymbol[sym].delta;
        filled[`${r.state}|${sym}|closure`] = r.bySymbol[sym].closure;
      }
      filled[`${r.state}|efNew`] = r.efNew;
    }
    setPracticeAnswers(filled);
    setPracticeVerified(true);
    metroAudio.playValidExitChime();
  };

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full mb-2">
              <Table2 className="w-3.5 h-3.5" />
              <span>Lámina 2 · Cerradura Épsilon y Regla de los 3 Pasos</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Capítulo 2: Cómo llenar la tabla `ε-C → δ(x, σ) → ε-C` ({spec.title})
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Para cada estación <strong>x</strong> y cada boleto <strong>σ ∈ {`{${alphabet.join(', ')}}`}</strong>,
              caminas gratis por <strong>ε</strong> antes del viaje (Paso 1), tomas el tren con <strong>σ</strong> (Paso 2),
              y vuelves a caminar gratis por <strong>ε</strong> al bajar (Paso 3). Quien alcance un estado final original por pasillos <strong>ε</strong> hereda <strong>EF nuevo = 1</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setMode('guided')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                mode === 'guided'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Modo Guiado (Explorar flechas)
            </button>
            <button
              onClick={() => setMode('practice')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                mode === 'practice'
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Modo Práctica (Llenar tabla)
            </button>
          </div>
        </div>
      </section>

      {/* Interactive NFA Map + Mini-game ε-C */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2.5">
            <span className="text-xs text-slate-600">
              Haz clic en cualquier celda de la tabla inferior para iluminar exactamente esos saltos en el mapa.
            </span>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showNewAcceptsOnMap}
                onChange={(e) => setShowNewAcceptsOnMap(e.target.checked)}
                className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
              />
              <span>Mostrar EF nuevo (círculo punteado)</span>
            </label>
          </div>

          <MetroMapNFA
            bundle={bundle}
            activeStates={mapHighlights.activeStates}
            highlightedTransitions={mapHighlights.transitions}
            selectedStation={focus.state}
            onSelectStation={(st) => setFocus((prev) => ({ ...prev, state: st }))}
            showNewAccepts={showNewAcceptsOnMap}
            caption={`Ruta resaltada: ${focus.state} con boleto "${activeSymbol}"`}
          />
        </div>

        {/* Right Column: Live 4-box Arrow Pipeline + Mini-game */}
        <div className="xl:col-span-5 space-y-4">
          {/* 4-Box Arrow Pipeline */}
          {activeRow && activeCell && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tubería en vivo de 3 pasos
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Estación <span className="font-mono text-orange-700">{activeRow.state}</span> ({stations[activeRow.state]?.metroName}) con boleto{' '}
                    <span className="font-mono bg-orange-100 text-orange-900 px-1.5 py-0.5 rounded">
                      {activeSymbol}
                    </span>
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  {alphabet.map((sym) => (
                    <button
                      key={sym}
                      onClick={() => setFocus((prev) => ({ ...prev, symbol: sym }))}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                        activeSymbol === sym
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 visual pipeline boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  <div className="text-[10px] font-semibold uppercase text-slate-500">0. Estado x</div>
                  <div className="font-mono font-bold text-sm text-slate-900 mt-1">{activeRow.state}</div>
                </div>
                <div className="bg-sky-50 border border-sky-200 rounded-lg p-2.5">
                  <div className="text-[10px] font-semibold uppercase text-sky-700">1. ε-C({activeRow.state})</div>
                  <div className="font-mono font-bold text-xs text-sky-900 mt-1 break-all">{activeRow.epsilonC}</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  <div className="text-[10px] font-semibold uppercase text-amber-800">2. δ(·, {activeSymbol})</div>
                  <div className="font-mono font-bold text-xs text-amber-900 mt-1 break-all">{activeCell.delta}</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                  <div className="text-[10px] font-semibold uppercase text-emerald-800">3. ε-C final</div>
                  <div className="font-mono font-bold text-xs text-emerald-900 mt-1 break-all">{activeCell.closure}</div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-700 leading-relaxed space-y-1.5">
                <p>
                  <strong className="text-slate-900">Explicación paso a paso:</strong> {activeCell.why}
                </p>
                <p className="text-slate-600">
                  <strong className="text-slate-800">Regla de Examen (EF):</strong> {activeRow.whyEF}
                </p>
              </div>
            </div>
          )}

          {/* Mini-Game: Practice ε-C(x) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">Mini-Reto: Calcula ε-C(x) gratis</h3>
              </div>
              <select
                value={miniState}
                onChange={(e) => {
                  const st = e.target.value;
                  setMiniState(st);
                  setMiniPicked([st]);
                  setMiniChecked(false);
                }}
                className="text-xs font-mono font-semibold border border-slate-200 rounded-md px-2 py-1 bg-slate-50"
              >
                {spec.states.map((st) => (
                  <option key={st} value={st}>
                    Calcular ε-C({st})
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-slate-600">
              Desde <strong>{miniState}</strong>, marca todos los andenes a los que llegas{' '}
              <strong>solo caminando por flechas ε</strong> (incluyendo el propio {miniState}):
            </p>

            <div className="flex flex-wrap gap-1.5">
              {spec.states.map((st) => {
                const picked = miniPicked.includes(st);
                return (
                  <button
                    key={st}
                    onClick={() => toggleMiniPick(st)}
                    className={`px-3 py-1.5 rounded-md font-mono text-xs font-bold border transition-colors ${
                      picked
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                onClick={handleCheckMini}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
              >
                Comprobar ε-C({miniState})
              </button>
              {miniChecked && (
                <div
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                    miniIsCorrect ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {miniIsCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>¡Exacto! {targetMiniRow?.epsilonC}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Respuesta correcta: {targetMiniRow?.epsilonC}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {miniChecked && targetMiniRow && (
              <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-2.5">
                {targetMiniRow.closureReason}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Stage 2 Table (Lámina 2 Exact 3-step Format) */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Tabla Completa de Cerraduras (Lámina 2 · Paso 1 → Paso 2 → Paso 3)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'guided'
                ? 'Haz clic en cualquier celda de símbolo para inspeccionar su derivación en la tubería.'
                : 'Selecciona el conjunto resultante para cada paso y pulsa Comprobar.'}
            </p>
          </div>

          {mode === 'practice' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setPracticeVerified(true);
                  if (practiceStats.correct === practiceStats.total) metroAudio.playValidExitChime();
                  else metroAudio.playTicketClick();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Comprobar ({practiceStats.correct}/{practiceStats.total})</span>
              </button>
              <button
                onClick={handleAutoFillPractice}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Revelar solución</span>
              </button>
              <button
                onClick={() => {
                  setPracticeAnswers({});
                  setPracticeVerified(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar</span>
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[680px]">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-3 py-2.5 text-left font-semibold border border-slate-700">Est.</th>
                <th className="px-3 py-2.5 text-left font-semibold border border-slate-700 bg-sky-900/60">
                  1. ε-C(x)
                </th>
                {alphabet.map((sym) => (
                  <React.Fragment key={sym}>
                    <th className="px-3 py-2.5 text-left font-semibold border border-slate-700 bg-amber-900/50">
                      2. δ(x, {sym})
                    </th>
                    <th className="px-3 py-2.5 text-left font-semibold border border-slate-700 bg-emerald-900/60">
                      3. ε-C → AFN({sym})
                    </th>
                  </React.Fragment>
                ))}
                <th className="px-2.5 py-2.5 text-center font-semibold border border-slate-700">EF orig.</th>
                <th className="px-2.5 py-2.5 text-center font-semibold border border-slate-700 bg-orange-900/70">
                  EF nuevo
                </th>
              </tr>
            </thead>
            <tbody>
              {stage2Rows.map((row) => {
                const isSelectedRow = focus.state === row.state;
                return (
                  <tr
                    key={row.state}
                    className={isSelectedRow ? 'bg-orange-50/40' : 'hover:bg-slate-50/80'}
                  >
                    <td className="px-3 py-2.5 border border-slate-200 font-mono font-bold text-slate-900">
                      <button
                        onClick={() => setFocus((prev) => ({ ...prev, state: row.state }))}
                        className="inline-flex items-center gap-1.5 hover:text-orange-700"
                        title={stations[row.state]?.metroName}
                      >
                        <span>{row.state}</span>
                        {row.state === spec.startState && (
                          <span className="text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Ini
                          </span>
                        )}
                      </button>
                    </td>

                    <td className="px-3 py-2.5 border border-slate-200 font-mono text-sky-900 bg-sky-50/40">
                      {row.epsilonC}
                    </td>

                    {alphabet.map((sym) => {
                      const cell = row.bySymbol[sym];
                      const isCellActive = focus.state === row.state && activeSymbol === sym;
                      const deltaKey = `${row.state}|${sym}|delta`;
                      const closureKey = `${row.state}|${sym}|closure`;

                      if (mode === 'guided') {
                        return (
                          <React.Fragment key={sym}>
                            <td
                              onClick={() => setFocus({ state: row.state, symbol: sym })}
                              className={`px-3 py-2.5 border border-slate-200 font-mono cursor-pointer transition-colors ${
                                isCellActive
                                  ? 'bg-amber-100 text-amber-950 font-bold ring-1 ring-inset ring-amber-400'
                                  : 'text-amber-900 hover:bg-amber-50'
                              }`}
                            >
                              {cell.delta}
                            </td>
                            <td
                              onClick={() => setFocus({ state: row.state, symbol: sym })}
                              className={`px-3 py-2.5 border border-slate-200 font-mono cursor-pointer transition-colors ${
                                isCellActive
                                  ? 'bg-emerald-100 text-emerald-950 font-bold ring-1 ring-inset ring-emerald-500'
                                  : 'text-emerald-900 font-semibold hover:bg-emerald-50'
                              }`}
                            >
                              {cell.closure}
                            </td>
                          </React.Fragment>
                        );
                      }

                      const dVal = practiceAnswers[deltaKey] ?? '';
                      const cVal = practiceAnswers[closureKey] ?? '';
                      const dOk = dVal === cell.delta;
                      const cOk = cVal === cell.closure;

                      return (
                        <React.Fragment key={sym}>
                          <td className="px-2 py-2 border border-slate-200">
                            <select
                              value={dVal}
                              onChange={(e) => {
                                setFocus({ state: row.state, symbol: sym });
                                setPracticeAnswers((prev) => ({ ...prev, [deltaKey]: e.target.value }));
                              }}
                              className={`w-full font-mono text-xs rounded border px-1.5 py-1 ${
                                practiceVerified && dVal
                                  ? dOk
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                                    : 'border-rose-500 bg-rose-50 text-rose-900'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              <option value="">-- elegir --</option>
                              {practiceSetOptions.map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2 border border-slate-200">
                            <select
                              value={cVal}
                              onChange={(e) => {
                                setFocus({ state: row.state, symbol: sym });
                                setPracticeAnswers((prev) => ({ ...prev, [closureKey]: e.target.value }));
                              }}
                              className={`w-full font-mono text-xs rounded border px-1.5 py-1 ${
                                practiceVerified && cVal
                                  ? cOk
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                                    : 'border-rose-500 bg-rose-50 text-rose-900'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              <option value="">-- elegir --</option>
                              {practiceSetOptions.map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          </td>
                        </React.Fragment>
                      );
                    })}

                    <td className="px-2.5 py-2.5 border border-slate-200 text-center font-mono">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold ${
                          row.efOriginal === '1'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {row.efOriginal}
                      </span>
                    </td>

                    <td className="px-2.5 py-2.5 border border-slate-200 text-center font-mono bg-orange-50/40">
                      {mode === 'guided' ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-bold ${
                            row.efNew === '1'
                              ? 'bg-orange-600 text-white'
                              : 'text-slate-400'
                          }`}
                        >
                          {row.efNew}
                        </span>
                      ) : (
                        <select
                          value={practiceAnswers[`${row.state}|efNew`] ?? ''}
                          onChange={(e) =>
                            setPracticeAnswers((prev) => ({
                              ...prev,
                              [`${row.state}|efNew`]: e.target.value,
                            }))
                          }
                          className={`font-mono text-xs rounded border px-1.5 py-1 ${
                            practiceVerified && practiceAnswers[`${row.state}|efNew`]
                              ? practiceAnswers[`${row.state}|efNew`] === row.efNew
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                                : 'border-rose-500 bg-rose-50 text-rose-900'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          <option value="">?</option>
                          <option value="∅">∅</option>
                          <option value="1">1</option>
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary AFN Table (Lámina 2 derecha / Lámina 3 izquierda) */}
        <div className="pt-2">
          <button
            onClick={() => setShowSummaryTable((v) => !v)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-orange-700"
          >
            <GraduationCap className="w-4 h-4 text-orange-600" />
            <span>
              {showSummaryTable ? 'Ocultar' : 'Mostrar'} Tabla Resumen AFN (Lámina 2 derecha · Base para Subconjuntos)
            </span>
          </button>

          {showSummaryTable && (
            <div className="mt-3 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-8 overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="px-3 py-2 text-left border border-slate-700">AFN (x)</th>
                      <th className="px-3 py-2 text-left border border-slate-700 text-sky-200">ε-C(x)</th>
                      {alphabet.map((sym) => (
                        <th key={sym} className="px-3 py-2 text-left border border-slate-700">
                          {sym}
                        </th>
                      ))}
                      <th className="px-2.5 py-2 text-center border border-slate-700">EF orig</th>
                      <th className="px-2.5 py-2 text-center border border-slate-700 bg-orange-900/70">
                        EF nuevo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stage2Rows.map((row) => (
                      <tr key={row.state} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5 border border-slate-200 font-mono font-bold text-slate-900">
                          {row.state}
                        </td>
                        <td className="px-3 py-1.5 border border-slate-200 font-mono text-sky-800">
                          {row.epsilonC}
                        </td>
                        {alphabet.map((sym) => (
                          <td
                            key={sym}
                            className="px-3 py-1.5 border border-slate-200 font-mono font-semibold text-emerald-900"
                          >
                            {row.bySymbol[sym].closure}
                          </td>
                        ))}
                        <td className="px-2.5 py-1.5 border border-slate-200 text-center font-mono">
                          {row.efOriginal}
                        </td>
                        <td className="px-2.5 py-1.5 border border-slate-200 text-center font-mono font-bold">
                          <span
                            className={
                              row.efNew === '1' ? 'text-orange-700' : 'text-slate-400'
                            }
                          >
                            {row.efNew}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:col-span-4 bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span>Conjuntos candidatos para el AFD</span>
                </div>
                <p className="text-amber-900/90 leading-relaxed">
                  Al limpiar la columna 3 ya conocemos todas las bolsas que aparecerán al unir filas en el Paso 3:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {candidateSets.map((cs) => (
                    <span
                      key={cs}
                      className="px-2 py-0.5 rounded bg-white border border-amber-300 font-mono font-bold text-amber-900"
                    >
                      {cs}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onNextStage}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            <span>Ir al Capítulo 3: Súper-Andenes (AFD)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
