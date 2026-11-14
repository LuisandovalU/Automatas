import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Lightbulb, Sparkles } from 'lucide-react';
import { DFA_ORDER, DFA_STATIONS, DfaStateId, IMAGE2_TABLE, ROOT_WHY_QUESTIONS } from '../data/automataData';
import { metroAudio } from '../utils/metroAudio';

type CellField = 'onA' | 'onB' | 'ef';

interface UserTableState {
  [key: string]: {
    onA: DfaStateId | '';
    onB: DfaStateId | '';
    ef: '∅' | '1' | '';
  };
}

const INITIAL_USER_TABLE: UserTableState = {
  '[A]': { onA: '[B]', onB: '', ef: '∅' },
  '[B]': { onA: '', onB: '', ef: '∅' },
  '[∅]': { onA: '[∅]', onB: '[∅]', ef: '∅' },
  '[C,D,F]': { onA: '', onB: '', ef: '' },
  '[E,D,F]': { onA: '', onB: '', ef: '' },
};

export const Stage3Subset: React.FC<{ onNextStage: () => void }> = ({ onNextStage }) => {
  const [userTable, setUserTable] = useState<UserTableState>(INITIAL_USER_TABLE);
  const [focusedRow, setFocusedRow] = useState<DfaStateId>('[C,D,F]');
  const [focusedField, setFocusedField] = useState<CellField>('onA');
  const [showHint, setShowHint] = useState(true);

  const updateCell = (rowId: DfaStateId, field: CellField, value: string) => {
    setFocusedRow(rowId);
    setFocusedField(field);
    if (value !== '') {
      if (DFA_STATIONS[rowId][field] === value) metroAudio.playTransferChime();
      else metroAudio.playDeadEndBuzz();
    }
    setUserTable((prev) => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [field]: value,
      },
    }));
  };

  const autofillTable = () => {
    const filled: UserTableState = {};
    for (const id of DFA_ORDER) {
      filled[id] = {
        onA: DFA_STATIONS[id].onA,
        onB: DFA_STATIONS[id].onB,
        ef: DFA_STATIONS[id].ef,
      };
    }
    setUserTable(filled);
    metroAudio.playValidExitChime();
  };

  const resetTable = () => {
    setUserTable(INITIAL_USER_TABLE);
  };

  let correctCount = 0;
  const totalCells = DFA_ORDER.length * 3;
  for (const id of DFA_ORDER) {
    const truth = DFA_STATIONS[id];
    const u = userTable[id];
    if (u.onA === truth.onA) correctCount++;
    if (u.onB === truth.onB) correctCount++;
    if (u.ef === truth.ef) correctCount++;
  }

  const activeMeta = DFA_STATIONS[focusedRow];
  const activeHint =
    focusedField === 'onA'
      ? activeMeta.hintA
      : focusedField === 'onB'
      ? activeMeta.hintB
      : activeMeta.hintEF;

  const extraWhys = ROOT_WHY_QUESTIONS.slice(3, 6);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="text-xs font-medium text-slate-500">
          Capítulo 3 · Fusionar Andenes (Construcción de Subconjuntos AFN → AFD) · Imagen 3
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mt-1 text-balance">
          ¿Por qué aparecen los corchetes [C,D,F] y el pozo [∅]?
        </h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-4xl">
          En la tabla AFN ya quitamos los pasillos <span className="font-mono font-semibold">ε</span>, pero seguía un
          problema: al leer <span className="font-mono font-semibold">b</span> desde B podías quedar en{' '}
          <span className="font-mono font-semibold">C, D, F</span> a la vez. La solución genial del AFD es{' '}
          <strong className="text-slate-900">convertir cada grupo de andenes simultáneos en una sola Súper-Estación</strong>{' '}
          entre corchetes, y mandar todo boleto inválido a una Vía Muerta <span className="font-mono font-semibold">[∅]</span>.
        </p>
      </div>

      {/* Side-by-side comparison: Left AFN Table vs Right Interactive AFD Builder */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: AFN Reference from Image 3 */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Referencia: Tabla AFN (del paso anterior)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Úsala como guía para sumar destinos. Los corchetes de la derecha nacen de aquí.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs tabular-nums">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-2 px-3 font-semibold">Edos</th>
                  <th className="py-2 px-3 font-semibold font-mono">a</th>
                  <th className="py-2 px-3 font-semibold font-mono">b</th>
                  <th className="py-2 px-3 font-semibold font-mono">EF nuevo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {IMAGE2_TABLE.map((row) => {
                  const isUnreachableAlone = row.state === 'D' || row.state === 'F';
                  return (
                    <tr
                      key={row.state}
                      className={isUnreachableAlone ? 'bg-slate-50/70 text-slate-400' : 'text-slate-800'}
                    >
                      <td className="py-2 px-3 font-semibold">
                        {row.state}{' '}
                        {isUnreachableAlone && (
                          <span className="font-sans font-normal text-[11px] text-slate-400">
                            (no aislado)
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">{row.afnA}</td>
                      <td className="py-2 px-3">{row.afnB}</td>
                      <td className="py-2 px-3 font-semibold">{row.efNew}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-700 leading-relaxed space-y-1.5">
            <div className="font-semibold text-slate-900">
              Regla de oro para fusionar (ejemplo con [C,D,F]):
            </div>
            <p>
              Para saber a dónde va <span className="font-mono font-semibold">[C,D,F]</span> con boleto{' '}
              <span className="font-mono font-semibold">a</span>, junta las columnas <span className="font-mono">a</span>{' '}
              de C, D y F:
            </p>
            <p className="font-mono text-slate-900 bg-white border border-slate-200 rounded px-2.5 py-1.5">
              C(a)=E,D,F ∪ D(a)=E,D,F ∪ F(a)=∅ = [E,D,F]
            </p>
          </div>
        </div>

        {/* Right: Interactive AFD Builder */}
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Arma la tabla AFD (Súper-Estaciones)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                Progreso: {correctCount} de {totalCells} celdas correctas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetTable}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Reiniciar
              </button>
              <button
                onClick={autofillTable}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Completar tabla</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs sm:text-sm tabular-nums">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-2.5 px-3 font-semibold">Súper-Estación</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">Con boleto a</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">Con boleto b</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">Salida (EF)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {DFA_ORDER.map((id) => {
                  const truth = DFA_STATIONS[id];
                  const u = userTable[id];

                  const renderSelect = (field: 'onA' | 'onB') => {
                    const val = u[field];
                    const isRight = val === truth[field];
                    const hasVal = val !== '';
                    return (
                      <select
                        value={val}
                        onFocus={() => {
                          setFocusedRow(id);
                          setFocusedField(field);
                        }}
                        onChange={(e) => updateCell(id, field, e.target.value)}
                        aria-label={`${id} con ${field}`}
                        className={`w-full px-2.5 py-1.5 rounded-md border text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          !hasVal
                            ? 'bg-white border-slate-300 text-slate-500'
                            : isRight
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-rose-50 border-rose-300 text-rose-900'
                        }`}
                      >
                        <option value="">Elegir...</option>
                        {DFA_ORDER.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    );
                  };

                  const efRight = u.ef === truth.ef;
                  const efHasVal = u.ef !== '';

                  return (
                    <tr
                      key={id}
                      className={focusedRow === id ? 'bg-orange-50/30' : undefined}
                      onClick={() => setFocusedRow(id)}
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        {id}
                      </td>
                      <td className="py-2 px-3">{renderSelect('onA')}</td>
                      <td className="py-2 px-3">{renderSelect('onB')}</td>
                      <td className="py-2 px-3">
                        <select
                          value={u.ef}
                          onFocus={() => {
                            setFocusedRow(id);
                            setFocusedField('ef');
                          }}
                          onChange={(e) => updateCell(id, 'ef', e.target.value)}
                          aria-label={`${id} estado final`}
                          className={`w-full px-2.5 py-1.5 rounded-md border text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            !efHasVal
                              ? 'bg-white border-slate-300 text-slate-500'
                              : efRight
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : 'bg-rose-50 border-rose-300 text-rose-900'
                          }`}
                        >
                          <option value="">?</option>
                          <option value="∅">∅ (No)</option>
                          <option value="1">1 (Sí)</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Live Logic Hint Box with Visual Arrows */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-orange-600" />
                <span>
                  Proceso con flechas · {focusedRow} ·{' '}
                  {focusedField === 'onA'
                    ? 'Boleto a'
                    : focusedField === 'onB'
                    ? 'Boleto b'
                    : '¿Es salida válida?'}
                </span>
              </div>
              <button
                onClick={() => setShowHint((s) => !s)}
                className="text-xs text-slate-500 hover:text-slate-900 underline"
              >
                {showHint ? 'Ocultar flechas' : 'Ver flechas'}
              </button>
            </div>

            {showHint && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center text-center">
                  <div className="bg-white border border-slate-200 rounded-md p-2">
                    <div className="text-[10px] text-slate-500">Súper-estación</div>
                    <div className="font-mono text-xs font-bold text-slate-900 mt-0.5">{focusedRow}</div>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-[10px] font-semibold text-sky-800">
                      {focusedField === 'ef' ? 'Revisa EF en AFN' : `Busca "${focusedField === 'onA' ? 'a' : 'b'}" en AFN`}
                    </div>
                    <ArrowRight className="w-4 h-4 text-orange-600 rotate-90 sm:rotate-0 my-0.5" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-md p-2">
                    <div className="text-[10px] text-slate-500">Une sus miembros</div>
                    <div className="font-mono text-[11px] font-semibold text-slate-800 mt-0.5">
                      {focusedRow === '[∅]'
                        ? '∅'
                        : focusedRow
                            .replace('[', '')
                            .replace(']', '')
                            .split(',')
                            .map((m) => `${m}→${focusedField === 'ef' ? IMAGE2_TABLE.find((r) => r.state === m)?.efNew : focusedField === 'onA' ? IMAGE2_TABLE.find((r) => r.state === m)?.afnA : IMAGE2_TABLE.find((r) => r.state === m)?.afnB}`)
                            .join(' ∪ ')}
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-[10px] font-semibold text-sky-800">Empaqueta</div>
                    <ArrowRight className="w-4 h-4 text-orange-600 rotate-90 sm:rotate-0 my-0.5" />
                  </div>
                  <div className="bg-orange-600 border border-orange-700 rounded-md p-2 text-white">
                    <div className="text-[10px] text-orange-100">Resultado AFD</div>
                    <div className="font-mono text-xs font-bold mt-0.5">
                      {DFA_STATIONS[focusedRow][focusedField]}
                    </div>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{activeHint}</p>
              </>
            )}
          </div>

          {correctCount === totalCells && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>¡Tabla AFD completa! Ya eliminaste toda ambigüedad.</span>
              </div>
              <button
                onClick={onNextStage}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 whitespace-nowrap"
              >
                <span>Probar el mapa final</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Deep Why cards for Stage 3 */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Los 3 misterios de esta tabla explicados desde la raíz
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Las dudas más comunes al pasar de la Imagen 3 a la Imagen 4.
            </p>
          </div>
          <button
            onClick={onNextStage}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <span>Ir al Capítulo 4: Simulador & Reto</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          {extraWhys.map((item) => (
            <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold text-slate-900 leading-snug">{item.question}</h4>
              <p className="text-xs font-medium text-orange-800">{item.shortAnswer}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{item.deepExplanation}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
