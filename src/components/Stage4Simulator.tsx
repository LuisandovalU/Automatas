import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Pause, Play, RotateCcw, StepBack, StepForward, XCircle } from 'lucide-react';
import { MetroMapDFA } from './MetroMapDFA';
import {
  DFA_ORDER,
  DFA_STATIONS,
  DfaStateId,
  DfaStationMeta,
  QUIZ_QUESTIONS,
  SLIDE_TEST_STRINGS,
} from '../data/automataData';
import { metroAudio } from '../utils/metroAudio';

interface DfaStep {
  step: number;
  symbol: string;
  state: DfaStateId | 'INVALID_CHAR';
  edgeId: string | null;
  narration: string;
}

function buildDfaTrace(input: string): DfaStep[] {
  const clean = input.trim().toLowerCase();
  const steps: DfaStep[] = [
    {
      step: 0,
      symbol: 'Inicio',
      state: '[A]',
      edgeId: null,
      narration: 'El tren arranca en la Súper-Estación [A] (Inicio). Esperando el primer boleto.',
    },
  ];

  let current: DfaStateId = '[A]';

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch !== 'a' && ch !== 'b') {
      steps.push({
        step: i + 1,
        symbol: ch,
        state: 'INVALID_CHAR',
        edgeId: null,
        narration: `El símbolo "${ch}" no existe en el alfabeto {a, b} del Metro. El torniquete rechaza el viaje de inmediato.`,
      });
      break;
    }

    const meta: DfaStationMeta = DFA_STATIONS[current];
    const next: DfaStateId = ch === 'a' ? meta.onA : meta.onB;
    const edgeId = `${current}-${ch}-${next}`;

    let narration = `Mostraste "${ch}" en ${current} → el tren avanza a ${next}. `;
    if (next === '[B]') {
      narration += 'Ya cumpliste la "a" inicial; ahora falta la "b".';
    } else if (next === '[C,D,F]') {
      narration += '¡Completaste "ab"! Estás en salida válida (EF = 1).';
    } else if (next === '[E,D,F]' && current === '[C,D,F]') {
      narration += 'Entraste al bucle a* con una "a" extra. Sigues en salida válida (EF = 1).';
    } else if (next === '[E,D,F]' && current === '[E,D,F]') {
      narration += 'Vuelta en el bucle a*: puedes repetir "a" cuantas veces quieras y sigues válido.';
    } else if (next === '[∅]') {
      narration +=
        current === '[∅]'
          ? 'Sigues atrapado en la Vía Muerta [∅]. Ya no hay forma de salir válido.'
          : 'Boleto prohibido en esta estación: el desvío te manda a la Vía Muerta [∅] sin retorno.';
    }

    steps.push({
      step: i + 1,
      symbol: ch,
      state: next,
      edgeId,
      narration,
    });
    current = next;
  }

  return steps;
}

export const Stage4Simulator: React.FC = () => {
  const [inputStr, setInputStr] = useState('aba');
  const [cursor, setCursor] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [inspectedDfa, setInspectedDfa] = useState<DfaStateId | null>(null);

  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  const trace = useMemo(() => buildDfaTrace(inputStr), [inputStr]);
  const safeCursor = Math.min(cursor, trace.length - 1);
  const currentStep = trace[safeCursor];
  const finalStep = trace[trace.length - 1];
  const isEnd = safeCursor === trace.length - 1;
  const isAccepted =
    finalStep.state !== 'INVALID_CHAR' && DFA_STATIONS[finalStep.state].ef === '1';

  useEffect(() => {
    if (safeCursor === 0) return;
    const step = trace[safeCursor];
    if (step.state === 'INVALID_CHAR' || step.state === '[∅]') {
      metroAudio.playDeadEndBuzz();
    } else if (safeCursor === trace.length - 1 && DFA_STATIONS[step.state].ef === '1') {
      metroAudio.playValidExitChime();
    } else {
      metroAudio.playTicketClick();
    }
  }, [safeCursor, trace]);

  useEffect(() => {
    if (!isPlaying) return;
    if (safeCursor >= trace.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setCursor((c) => Math.min(trace.length - 1, c + 1));
    }, 850);
    return () => window.clearTimeout(timer);
  }, [isPlaying, safeCursor, trace.length]);

  const selectTestCase = (text: string) => {
    setIsPlaying(false);
    setInputStr(text);
    setCursor(0);
  };

  const quizScore = QUIZ_QUESTIONS.reduce((acc, q) => {
    return acc + (quizAnswers[q.id] === q.correctIndex ? 1 : 0);
  }, 0);
  const answeredCount = Object.keys(quizAnswers).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="text-xs font-medium text-slate-500">
          Capítulo 4 · Simulador Final AFD y Reto de Comprensión · Imagen 4
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mt-1 text-balance">
          Pon a prueba las cadenas de la pizarra en el Metro Determinista
        </h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-4xl">
          Este es el diagrama final de la Imagen 4. Sin pasillos invisibles ni clones: cada boleto te lleva a{' '}
          <strong className="text-slate-900">una única estación exacta</strong>. Si terminas en{' '}
          <span className="font-mono font-semibold text-emerald-700">[C,D,F]</span> o{' '}
          <span className="font-mono font-semibold text-emerald-700">[E,D,F]</span>, tu viaje es aceptado.
        </p>
      </div>

      {/* Main Two-Zone Simulator */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-5">
          <MetroMapDFA
            activeState={currentStep.state === 'INVALID_CHAR' ? null : currentStep.state}
            highlightedEdge={currentStep.edgeId}
            onSelectState={(st) => {
              setInspectedDfa(st);
              metroAudio.playTicketClick();
            }}
            caption="Haz clic en cualquier súper-estación para ver por qué existe. Observa el auto-bucle en [E,D,F] y la Vía Muerta [∅]."
          />

          {inspectedDfa && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs text-slate-500">
                  Inspección · {DFA_STATIONS[inspectedDfa].subtitle}
                </div>
                <div className="text-sm font-semibold text-slate-900 mt-0.5">
                  {DFA_STATIONS[inspectedDfa].metroName}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {DFA_STATIONS[inspectedDfa].whyExists}
                </p>
              </div>
              <div className="shrink-0 font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800">
                a → {DFA_STATIONS[inspectedDfa].onA} · b → {DFA_STATIONS[inspectedDfa].onB}
              </div>
            </div>
          )}

          {/* Clean Final Table from Image 4 */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Tabla Final AFD (Imagen 4)
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs sm:text-sm tabular-nums">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="py-2 px-3 font-semibold">Estados</th>
                    <th className="py-2 px-3 font-semibold font-mono">a</th>
                    <th className="py-2 px-3 font-semibold font-mono">b</th>
                    <th className="py-2 px-3 font-semibold font-mono">EF</th>
                    <th className="py-2 px-3 font-semibold">Significado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {DFA_ORDER.map((id) => {
                    const row = DFA_STATIONS[id];
                    const isActiveRow = currentStep.state === id;
                    return (
                      <tr
                        key={id}
                        className={isActiveRow ? 'bg-orange-50 font-semibold' : 'text-slate-700'}
                      >
                        <td className="py-2 px-3 text-slate-900">{id}</td>
                        <td className="py-2 px-3">{row.onA}</td>
                        <td className="py-2 px-3">{row.onB}</td>
                        <td
                          className={`py-2 px-3 font-semibold ${
                            row.ef === '1' ? 'text-emerald-700' : 'text-slate-500'
                          }`}
                        >
                          {row.ef}
                        </td>
                        <td className="py-2 px-3 font-sans text-xs text-slate-600">
                          {row.subtitle}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Controls: Strings from Slide + Playback */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Taquilla de Prueba (Cadenas de la Imagen 4)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Elige cualquiera de los ejemplos de tu pizarra o escribe tu propia palabra.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-semibold text-emerald-800 mb-1.5">
                Deben aceptarse
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SLIDE_TEST_STRINGS.filter((t) => t.expectedValid).map((t) => (
                  <button
                    key={t.text}
                    onClick={() => selectTestCase(t.text)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-semibold border transition-colors ${
                      inputStr.toLowerCase() === t.text
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {t.text}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-rose-800 mb-1.5">
                Deben rechazarse
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SLIDE_TEST_STRINGS.filter((t) => !t.expectedValid).map((t) => (
                  <button
                    key={t.text}
                    onClick={() => selectTestCase(t.text)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-semibold border transition-colors ${
                      inputStr.toLowerCase() === t.text
                        ? 'bg-rose-700 text-white border-rose-700'
                        : 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    {t.text}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom string input */}
          <div>
            <label htmlFor="custom-string" className="block text-xs font-medium text-slate-700 mb-1.5">
              O escribe cualquier cadena (ej. abaaaa, baa, abas):
            </label>
            <input
              id="custom-string"
              type="text"
              value={inputStr}
              maxLength={16}
              onChange={(e) => {
                setIsPlaying(false);
                setInputStr(e.target.value);
                setCursor(0);
              }}
              placeholder="Ej. abaa"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Step tokens */}
          <div className="flex flex-wrap items-center gap-1.5">
            {trace.map((st, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsPlaying(false);
                  setCursor(idx);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold border transition-colors ${
                  safeCursor === idx
                    ? 'bg-orange-600 text-white border-orange-600'
                    : idx < safeCursor
                    ? 'bg-orange-50 text-orange-900 border-orange-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                {st.symbol}
              </button>
            ))}
          </div>

          {/* Playback Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setIsPlaying(false);
                setCursor(0);
              }}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCursor((c) => Math.max(0, c - 1));
              }}
              disabled={safeCursor === 0}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <StepBack className="w-3.5 h-3.5" />
              <span>Atrás</span>
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCursor((c) => Math.min(trace.length - 1, c + 1));
              }}
              disabled={isEnd}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <StepForward className="w-3.5 h-3.5" />
              <span>Siguiente</span>
            </button>
            <button
              onClick={() => {
                if (isEnd) {
                  setCursor(0);
                  setIsPlaying(true);
                } else {
                  setIsPlaying((p) => !p);
                }
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-orange-600 text-white hover:bg-orange-700 whitespace-nowrap"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pausar' : isEnd ? 'Repetir viaje' : 'Reproducir viaje'}</span>
            </button>
          </div>

          {/* Narration box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
              <span>
                Paso {safeCursor} de {trace.length - 1}
              </span>
              <span className="font-mono font-semibold text-slate-900">
                Estación: {currentStep.state === 'INVALID_CHAR' ? 'Error de símbolo' : currentStep.state}
              </span>
            </div>
            <p className="text-sm text-slate-800 leading-relaxed">{currentStep.narration}</p>

            {isEnd && (
              <div
                className={`pt-2.5 border-t border-slate-200 flex items-start gap-2 text-xs font-semibold ${
                  isAccepted ? 'text-emerald-800' : 'text-rose-800'
                }`}
              >
                {isAccepted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>
                  {isAccepted
                    ? `CADENA ACEPTADA ("${inputStr || 'ε'}") — Terminaste en ${finalStep.state}, que tiene salida válida EF = 1.`
                    : `CADENA RECHAZADA ("${inputStr || 'ε'}") — ${
                        finalStep.state === 'INVALID_CHAR'
                          ? 'Contiene letras fuera del alfabeto {a, b}.'
                          : `Terminaste en ${finalStep.state}, que tiene EF = ∅.`
                      }`}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Final Comprehension Quiz */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Reto final: Comprueba que entendiste el "por qué"
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              6 preguntas de lógica pura sobre el ejercicio (ab)a*.
            </p>
          </div>
          <div className="text-sm font-semibold text-slate-900 tabular-nums">
            Aciertos: {quizScore} / {QUIZ_QUESTIONS.length}
            <span className="text-xs font-normal text-slate-500 ml-2">
              ({answeredCount} respondidas)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {QUIZ_QUESTIONS.map((q, qIdx) => {
            const picked = quizAnswers[q.id];
            const hasAnswered = picked !== undefined;
            const isCorrect = picked === q.correctIndex;

            return (
              <div
                key={q.id}
                className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3"
              >
                <div className="text-sm font-semibold text-slate-900 leading-snug">
                  <span className="font-mono text-orange-700 mr-1.5 tabular-nums">
                    {qIdx + 1}.
                  </span>
                  {q.prompt}
                </div>

                <div className="space-y-1.5">
                  {q.options.map((opt, optIdx) => {
                    const selectedThis = picked === optIdx;
                    const isRightOpt = optIdx === q.correctIndex;

                    let btnStyle =
                      'bg-white border-slate-200 text-slate-700 hover:bg-slate-100';
                    if (hasAnswered) {
                      if (isRightOpt) {
                        btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold';
                      } else if (selectedThis) {
                        btnStyle = 'bg-rose-50 border-rose-400 text-rose-900';
                      } else {
                        btnStyle = 'bg-white border-slate-200 text-slate-400';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => {
                          setQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                          if (optIdx === q.correctIndex) metroAudio.playValidExitChime();
                          else metroAudio.playDeadEndBuzz();
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md border text-xs transition-colors ${btnStyle}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {hasAnswered && (
                  <div
                    className={`text-xs leading-relaxed pt-2 border-t ${
                      isCorrect
                        ? 'border-emerald-200 text-emerald-900'
                        : 'border-rose-200 text-rose-900'
                    }`}
                  >
                    <span className="font-semibold">
                      {isCorrect ? 'Correcto: ' : 'Para recordar: '}
                    </span>
                    {q.explanation}
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
