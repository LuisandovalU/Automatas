import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Eye,
  GitMerge,
  Info,
  Layers,
  RotateCcw,
} from 'lucide-react';
import {
  DEFAULT_EXERCISE_BUNDLE,
  SolvedMethodBundle,
} from '../engine/automataMethodEngine';
import { metroAudio } from '../utils/metroAudio';

interface Stage3SubsetProps {
  bundle?: SolvedMethodBundle;
  onNextStage: () => void;
}

export const Stage3Subset: React.FC<Stage3SubsetProps> = ({
  bundle = DEFAULT_EXERCISE_BUNDLE,
  onNextStage,
}) => {
  const {
    spec,
    stage2Rows,
    dfaStartId,
    dfaOrder,
    dfaRows,
    dfaHasTrapState,
    startHadEpsilonExpansion,
  } = bundle;

  const alphabet = spec.alphabet;
  const firstSym = alphabet[0] ?? 'a';

  const [mode, setMode] = useState<'explore' | 'build'>('explore');
  const [inspect, setInspect] = useState<{ stateId: string; symbol: string }>({
    stateId: dfaStartId,
    symbol: firstSym,
  });

  // User builder answers: key = `${dfaId}|sym|${sym}` or `${dfaId}|ef`
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [verified, setVerified] = useState(false);

  const initPrefill = (b: SolvedMethodBundle): Record<string, string> => {
    const pre: Record<string, string> = {};
    if (b.dfaRows['[∅]']) {
      for (const s of b.spec.alphabet) {
        pre['[∅]|sym|' + s] = '[∅]';
      }
      pre['[∅]|ef'] = '∅';
    }
    return pre;
  };

  useEffect(() => {
    setInspect({
      stateId: bundle.dfaStartId,
      symbol: bundle.spec.alphabet[0] ?? 'a',
    });
    setAnswers(initPrefill(bundle));
    setVerified(false);
  }, [bundle]);

  const activeDfaRow = dfaRows[inspect.stateId] ?? dfaRows[dfaStartId];
  const activeSym = alphabet.includes(inspect.symbol) ? inspect.symbol : firstSym;

  // Dynamic Golden Union Example (prefer first multi-member state, else start state)
  const goldenExample = useMemo(() => {
    const multiId =
      dfaOrder.find((id) => (dfaRows[id]?.members.length ?? 0) > 1) ?? dfaStartId;
    const row = dfaRows[multiId];
    return {
      stateId: multiId,
      symbol: firstSym,
      row,
      breakdown: row?.unionBreakdown[firstSym] ?? '',
    };
  }, [dfaOrder, dfaRows, dfaStartId, firstSym]);

  // All non-trap rows + trap row score
  const buildStats = useMemo(() => {
    let total = 0;
    let correct = 0;
    for (const id of dfaOrder) {
      const r = dfaRows[id];
      if (!r || r.isDeadEnd) continue;
      for (const sym of alphabet) {
        total++;
        if (answers[`${id}|sym|${sym}`] === r.transitions[sym]) correct++;
      }
      total++;
      if (answers[`${id}|ef`] === r.ef) correct++;
    }
    return { total, correct };
  }, [dfaOrder, dfaRows, alphabet, answers]);

  const handleAutoSolve = () => {
    const next: Record<string, string> = {};
    for (const id of dfaOrder) {
      const r = dfaRows[id];
      if (!r) continue;
      for (const sym of alphabet) {
        next[`${id}|sym|${sym}`] = r.transitions[sym];
      }
      next[`${id}|ef`] = r.ef;
    }
    setAnswers(next);
    setVerified(true);
    metroAudio.playValidExitChime();
  };

  const activeMembers = new Set(activeDfaRow?.members ?? []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full mb-2">
              <GitMerge className="w-3.5 h-3.5" />
              <span>Lámina 3 · Construcción de Subconjuntos (AFN → AFD)</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Capítulo 3: Súper-Andenes Deterministas en orden BFS ({spec.title})
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Arrancamos en <strong>{dfaStartId}</strong> y descubrimos nuevos conjuntos fila por fila conforme aparecen
              al unir las salidas del AFN. Si un súper-estado contiene al menos un miembro con{' '}
              <strong>EF nuevo = 1</strong>, el súper-estado completo hereda <strong>EF = 1</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setMode('explore')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                mode === 'explore'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Modo Guiado (Explorar uniones)
            </button>
            <button
              onClick={() => setMode('build')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                mode === 'build'
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Construir AFD ({buildStats.correct}/{buildStats.total})
            </button>
          </div>
        </div>
      </section>

      {/* ε-C(Inicio) Notice if start expanded */}
      {startHadEpsilonExpansion && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-start gap-3 text-xs text-sky-900">
          <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <div className="font-bold text-sm">
              ¡Atención al Inicio! Tu primer Súper-Estado es {dfaStartId} (no solo [{spec.startState}])
            </div>
            <p>
              Como desde el estado inicial <strong>{spec.startState}</strong> existen pasillos gratis <strong>ε</strong>,
              el pasajero ya está clonado desde el segundo cero en toda su cerradura{' '}
              <span className="font-mono font-bold">ε-C({spec.startState}) = {dfaStartId}</span>. Por eso la tabla AFD arranca exactamente ahí.
            </p>
          </div>
        </div>
      )}

      {/* Golden Union Rule Card */}
      {goldenExample.row && (
        <section className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wide text-amber-800">
                La Regla de Oro de la Unión
              </div>
              <p className="text-sm text-amber-950">
                Cuando estás en un súper-estado como{' '}
                <span className="font-mono font-bold">{goldenExample.stateId}</span> y llega el boleto{' '}
                <span className="font-mono font-bold">{goldenExample.symbol}</span>, simplemente miras cada miembro en la tabla AFN izquierda y unes sus bolsas:
              </p>
            </div>
            <div className="bg-white border border-amber-300 rounded-lg px-3.5 py-2 font-mono text-xs font-semibold text-slate-900 shrink-0">
              {goldenExample.breakdown}
            </div>
          </div>
        </section>
      )}

      {/* Side-by-Side Lámina 3 Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Reference: AFN Table */}
        <section className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Lámina 3 (Izquierda) · Referencia
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Tabla AFN (resaltando miembros de{' '}
              <span className="font-mono text-orange-700">{inspect.stateId}</span>)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="px-2.5 py-2 text-left border border-slate-700">Edos (ε-C)</th>
                  {alphabet.map((sym) => (
                    <th key={sym} className="px-2.5 py-2 text-left border border-slate-700">
                      {sym}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center border border-slate-700">EF orig</th>
                  <th className="px-2 py-2 text-center border border-slate-700 bg-orange-900/70">
                    EF nuevo
                  </th>
                </tr>
              </thead>
              <tbody>
                {stage2Rows.map((row) => {
                  const isHighlightedMember = activeMembers.has(row.state);
                  return (
                    <tr
                      key={row.state}
                      className={
                        isHighlightedMember
                          ? 'bg-amber-50 ring-1 ring-inset ring-amber-300'
                          : 'bg-white'
                      }
                    >
                      <td className="px-2.5 py-2 border border-slate-200 font-mono">
                        <span className="font-bold text-slate-900">{row.state}</span>{' '}
                        <span className="text-[11px] text-slate-500">{row.epsilonC}</span>
                      </td>
                      {alphabet.map((sym) => {
                        const isColActive = isHighlightedMember && sym === activeSym;
                        return (
                          <td
                            key={sym}
                            className={`px-2.5 py-2 border border-slate-200 font-mono ${
                              isColActive
                                ? 'bg-emerald-100 text-emerald-950 font-bold'
                                : 'text-slate-700'
                            }`}
                          >
                            {row.bySymbol[sym].closure}
                          </td>
                        );
                      })}
                      <td className="px-2 py-2 border border-slate-200 text-center font-mono">
                        {row.efOriginal}
                      </td>
                      <td className="px-2 py-2 border border-slate-200 text-center font-mono font-bold">
                        <span
                          className={
                            row.efNew === '1'
                              ? 'px-1.5 py-0.5 rounded bg-orange-100 text-orange-800'
                              : 'text-slate-400'
                          }
                        >
                          {row.efNew}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Inspector arrow hint box */}
          {activeDfaRow && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs space-y-2">
              <div className="font-semibold text-slate-900 flex items-center justify-between">
                <span>
                  Desglose de unión: {activeDfaRow.id} con boleto "{activeSym}"
                </span>
                <span className="font-mono text-orange-700">
                  → {activeDfaRow.transitions[activeSym]}
                </span>
              </div>
              <div className="bg-white border border-slate-200 rounded p-2 font-mono text-[11px] text-slate-800 break-words">
                {activeDfaRow.unionBreakdown[activeSym]}
              </div>
              <p className="text-slate-600 leading-relaxed">
                {activeDfaRow.hintBySymbol[activeSym]}
              </p>
              <p className="text-slate-600 leading-relaxed border-t border-slate-200 pt-1.5">
                <strong>EF de {activeDfaRow.id}:</strong> {activeDfaRow.hintEF}
              </p>
            </div>
          )}
        </section>

        {/* Right Table: AFD Subset Construction Table */}
        <section className="xl:col-span-7 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Lámina 3 (Derecha) · Orden BFS de Descubrimiento
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Tabla de Transiciones del AFD ({dfaOrder.length} Súper-Estados)
              </h3>
            </div>

            {mode === 'build' && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setVerified(true);
                    if (buildStats.correct === buildStats.total) metroAudio.playValidExitChime();
                    else metroAudio.playTicketClick();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verificar ({buildStats.correct}/{buildStats.total})</span>
                </button>
                <button
                  onClick={handleAutoSolve}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Completar</span>
                </button>
                <button
                  onClick={() => {
                    setAnswers(initPrefill(bundle));
                    setVerified(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpiar</span>
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="px-3 py-2.5 text-left border border-slate-700">Súper-Estado</th>
                  {alphabet.map((sym) => (
                    <th key={sym} className="px-3 py-2.5 text-left border border-slate-700">
                      Con {sym}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-center border border-slate-700 bg-emerald-900/70">
                    EF
                  </th>
                </tr>
              </thead>
              <tbody>
                {dfaOrder.map((id) => {
                  const row = dfaRows[id];
                  if (!row) return null;
                  const isRowFocused = inspect.stateId === id;

                  return (
                    <tr
                      key={id}
                      className={
                        isRowFocused
                          ? 'bg-orange-50/50'
                          : row.isDeadEnd
                          ? 'bg-rose-50/40'
                          : 'hover:bg-slate-50'
                      }
                    >
                      <td className="px-3 py-2.5 border border-slate-200 font-mono">
                        <button
                          onClick={() => setInspect((prev) => ({ ...prev, stateId: id }))}
                          className="text-left group"
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-bold ${
                                row.isDeadEnd
                                  ? 'text-rose-700'
                                  : isRowFocused
                                  ? 'text-orange-700'
                                  : 'text-slate-900 group-hover:text-orange-700'
                              }`}
                            >
                              {id}
                            </span>
                            {row.isStart && (
                              <span className="text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                Inicio
                              </span>
                            )}
                            {row.isDeadEnd && (
                              <span className="text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                                Pozo
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-sans text-slate-500 mt-0.5">
                            {row.subtitle}
                          </div>
                        </button>
                      </td>

                      {alphabet.map((sym) => {
                        const target = row.transitions[sym];
                        const isCellHot = isRowFocused && activeSym === sym;
                        const k = `${id}|sym|${sym}`;

                        if (mode === 'explore' || row.isDeadEnd) {
                          return (
                            <td
                              key={sym}
                              onClick={() => setInspect({ stateId: id, symbol: sym })}
                              className={`px-3 py-2.5 border border-slate-200 font-mono cursor-pointer transition-colors ${
                                isCellHot
                                  ? 'bg-orange-100 text-orange-950 font-bold ring-1 ring-inset ring-orange-400'
                                  : target === '[∅]'
                                  ? 'text-rose-700 hover:bg-rose-50'
                                  : 'text-slate-900 font-semibold hover:bg-slate-100'
                              }`}
                            >
                              {target}
                            </td>
                          );
                        }

                        const val = answers[k] ?? '';
                        const ok = val === target;
                        return (
                          <td key={sym} className="px-2 py-2 border border-slate-200">
                            <select
                              value={val}
                              onChange={(e) => {
                                setInspect({ stateId: id, symbol: sym });
                                setAnswers((prev) => ({ ...prev, [k]: e.target.value }));
                              }}
                              className={`w-full font-mono text-xs rounded border px-1.5 py-1 ${
                                verified && val
                                  ? ok
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                                    : 'border-rose-500 bg-rose-50 text-rose-900'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              <option value="">-- elegir --</option>
                              {dfaOrder.map((optId) => (
                                <option key={optId} value={optId}>
                                  {optId}
                                </option>
                              ))}
                            </select>
                          </td>
                        );
                      })}

                      <td className="px-3 py-2.5 border border-slate-200 text-center font-mono">
                        {mode === 'explore' || row.isDeadEnd ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-bold ${
                              row.ef === '1'
                                ? 'bg-emerald-600 text-white'
                                : 'text-slate-400'
                            }`}
                          >
                            {row.ef}
                          </span>
                        ) : (
                          <select
                            value={answers[`${id}|ef`] ?? ''}
                            onChange={(e) => {
                              setInspect((prev) => ({ ...prev, stateId: id }));
                              setAnswers((prev) => ({ ...prev, [`${id}|ef`]: e.target.value }));
                            }}
                            className={`font-mono text-xs rounded border px-1.5 py-1 ${
                              verified && answers[`${id}|ef`]
                                ? answers[`${id}|ef`] === row.ef
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

          {dfaHasTrapState && (
            <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                <strong>Estado Pozo [∅] completo:</strong> Un AFD es total; cuando ninguna ruta del AFN acepta cierto boleto desde un estado, se dibuja el estado trampa <span className="font-mono font-bold">[∅]</span> que se cicla consigo mismo para todos los símbolos.
              </span>
            </div>
          )}
        </section>
      </div>

      {/* BFS Discovery Explanation Cards */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-600" />
            <h3 className="text-base font-bold text-slate-900">
              ¿Por qué existe exactamente este orden de filas? (Descubrimiento BFS)
            </h3>
          </div>
          <button
            onClick={onNextStage}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <span>Ir al Capítulo 4: Pizarra y Quiz</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {dfaOrder.map((id, idx) => {
            const row = dfaRows[id];
            if (!row) return null;
            return (
              <div
                key={id}
                onClick={() => setInspect((prev) => ({ ...prev, stateId: id }))}
                className={`border rounded-lg p-3.5 text-xs cursor-pointer transition-colors ${
                  inspect.stateId === id
                    ? 'border-orange-400 bg-orange-50/40'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono font-bold text-sm text-slate-900">
                    #{idx + 1} · {id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                      row.ef === '1'
                        ? 'bg-emerald-100 text-emerald-800'
                        : row.isDeadEnd
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    EF = {row.ef}
                  </span>
                </div>
                <div className="font-semibold text-slate-700 mb-1">{row.subtitle}</div>
                <p className="text-slate-600 leading-relaxed">{row.whyExists}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
