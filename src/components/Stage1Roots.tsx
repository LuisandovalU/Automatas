import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Footprints,
  Info,
  RotateCcw,
  StepForward,
  TrainFront,
} from 'lucide-react';
import { ROOT_WHY_QUESTIONS } from '../data/automataData';
import {
  DEFAULT_EXERCISE_BUNDLE,
  SolvedMethodBundle,
  traceNfaExecution,
} from '../engine/automataMethodEngine';
import { metroAudio } from '../utils/metroAudio';
import { MetroMapNFA } from './MetroMapNFA';
import { RegexLibrarySection } from './RegexLibrarySection';

interface Stage1RootsProps {
  bundle?: SolvedMethodBundle;
  onNextStage: () => void;
}

export const Stage1Roots: React.FC<Stage1RootsProps> = ({
  bundle = DEFAULT_EXERCISE_BUNDLE,
  onNextStage,
}) => {
  const { spec, stations, testCases } = bundle;
  const defaultTicket = useMemo(() => {
    const firstValid = testCases.find((t) => t.expectedValid && t.text.length > 0);
    return firstValid?.text ?? spec.alphabet.join('');
  }, [testCases, spec.alphabet]);

  const [selectedInspect, setSelectedInspect] = useState<string>(spec.startState);
  const [ticketString, setTicketString] = useState<string>(defaultTicket);
  const [stepCursor, setStepCursor] = useState<number>(0);
  const [openWhyId, setOpenWhyId] = useState<string>(ROOT_WHY_QUESTIONS[0]?.id ?? '');

  useEffect(() => {
    setSelectedInspect(bundle.spec.startState);
    const firstValid = bundle.testCases.find((t) => t.expectedValid && t.text.length > 0);
    setTicketString(firstValid?.text ?? bundle.spec.alphabet.join(''));
    setStepCursor(0);
  }, [bundle]);

  const trace = useMemo(
    () => traceNfaExecution(bundle, ticketString),
    [bundle, ticketString]
  );

  const safeCursor = Math.min(stepCursor, Math.max(0, trace.length - 1));
  const currentStep = trace[safeCursor] ?? trace[0];
  const isFinalStep = safeCursor === trace.length - 1;
  const acceptedAtEnd =
    currentStep?.activeStates.some((st) => spec.acceptStates.includes(st)) ?? false;

  const inspectInfo = stations[selectedInspect] ?? stations[spec.startState];

  const handleSelectExample = (text: string) => {
    setTicketString(text);
    setStepCursor(0);
    metroAudio.playTicketClick();
  };

  const handleAppendTicket = (sym: string) => {
    setTicketString((prev) => prev + sym);
    setStepCursor(0);
    metroAudio.playTicketClick();
  };

  const handleStepForward = () => {
    if (safeCursor >= trace.length - 1) return;
    const nextIdx = safeCursor + 1;
    setStepCursor(nextIdx);
    const nextStep = trace[nextIdx];
    const hasAccept = nextStep.activeStates.some((st) => spec.acceptStates.includes(st));
    if (nextIdx === trace.length - 1) {
      if (hasAccept) metroAudio.playValidExitChime();
      else metroAudio.playDeadEndBuzz();
    } else if (nextStep.activeStates.length > 1) {
      metroAudio.playTransferChime();
    } else {
      metroAudio.playTicketClick();
    }
  };

  const outgoingFromInspect = useMemo(
    () => spec.transitions.filter((t) => t.from === selectedInspect),
    [spec.transitions, selectedInspect]
  );

  return (
    <div className="space-y-6">
      {/* Intro Conceptual */}
      <RegexLibrarySection />

      {/* Active AFN-ε Map + Ghost Passenger Simulator */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full mb-2">
              <Footprints className="w-3.5 h-3.5" />
              <span>Lámina 1 · Diagrama Base AFN-ε ({spec.title})</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Capítulo 1: Viaje del Pasajero Fantasma (por qué necesitamos convertir)
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              {spec.description} En un AFN-ε puedes clonarte por pasillos gratis{' '}
              <span className="font-mono font-semibold text-sky-700">ε</span>. Simula una cadena para ver cómo los clones se multiplican o desaparecen antes de construir el AFD.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 shrink-0">
            <div>
              <div className="text-slate-500">Inicio</div>
              <div className="font-mono font-bold text-slate-900">{spec.startState}</div>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <div className="text-slate-500">Finales (EF)</div>
              <div className="font-mono font-bold text-emerald-700">
                {`{${spec.acceptStates.join(', ')}}`}
              </div>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <div className="text-slate-500">Alfabeto Σ</div>
              <div className="font-mono font-bold text-orange-700">
                {`{${spec.alphabet.join(', ')}}`}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left: Interactive AFN-ε Map + Selected Station Inspector */}
          <div className="xl:col-span-7 space-y-4">
            <MetroMapNFA
              bundle={bundle}
              activeStates={currentStep?.activeStates ?? []}
              highlightedTransitions={currentStep?.highlightedEdges ?? []}
              selectedStation={selectedInspect}
              onSelectStation={(st) => {
                setSelectedInspect(st);
                metroAudio.playTicketClick();
              }}
              caption={`Estaciones activas en este paso: ${
                currentStep?.activeStates.length
                  ? `{${currentStep.activeStates.join(', ')}}`
                  : '∅'
              }`}
            />

            {inspectInfo && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-900 text-white">
                      {inspectInfo.id}
                    </span>
                    <span className="font-semibold text-sm text-slate-900">
                      {inspectInfo.metroName}
                    </span>
                    <span className="text-xs text-slate-500">· {inspectInfo.role}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                    {inspectInfo.isStart && (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Inicio
                      </span>
                    )}
                    {inspectInfo.isOriginalAccept && (
                      <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                        Final Original
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{inspectInfo.description}</p>
                <div className="text-xs text-slate-600 flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200">
                  <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>
                    Cerradura gratis{' '}
                    <strong className="font-mono text-sky-900">
                      ε-C({inspectInfo.id}) = {`{${inspectInfo.epsilonClosure.join(', ')}}`}
                    </strong>
                    : {inspectInfo.closureReason}
                  </span>
                </div>

                {outgoingFromInspect.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {outgoingFromInspect.map((tr) => (
                      <span
                        key={tr.id}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-mono ${
                          tr.kind === 'walk'
                            ? 'bg-sky-50 border-sky-200 text-sky-800'
                            : 'bg-orange-50 border-orange-200 text-orange-900'
                        }`}
                      >
                        {tr.kind === 'walk' ? (
                          <Footprints className="w-3 h-3" />
                        ) : (
                          <TrainFront className="w-3 h-3" />
                        )}
                        {tr.from} --({tr.label})→ {tr.to}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Ghost Passenger Simulator */}
          <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Simulador del Pasajero Fantasma (AFN-ε)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Observa cómo tus clones caminan gratis por ε antes y después de cada boleto.
              </p>
            </div>

            {/* Preset examples from bundle */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Ejemplos del ejercicio
              </div>
              <div className="flex flex-wrap gap-1.5">
                {testCases.slice(0, 6).map((ex) => (
                  <button
                    key={ex.label}
                    onClick={() => handleSelectExample(ex.text)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium border transition-colors ${
                      ticketString === ex.text
                        ? 'bg-slate-900 text-white border-slate-900'
                        : ex.expectedValid
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                    }`}
                    title={ex.reason}
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Alphabet Builder */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-600">
                Boletos:{' '}
                <span className="font-mono font-semibold text-slate-900 text-sm">
                  {ticketString || 'ε (vacía)'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {spec.alphabet.map((sym) => (
                  <button
                    key={sym}
                    onClick={() => handleAppendTicket(sym)}
                    className="px-2.5 py-1.5 rounded-md text-xs font-mono font-semibold bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100"
                  >
                    + {sym}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setTicketString('');
                    setStepCursor(0);
                  }}
                  className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Limpiar
                </button>
              </div>
            </div>

            {/* Step progress strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {trace.map((st, idx) => (
                <button
                  key={idx}
                  onClick={() => setStepCursor(idx)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold border transition-colors shrink-0 ${
                    safeCursor === idx
                      ? 'bg-orange-600 text-white border-orange-600'
                      : idx < safeCursor
                      ? 'bg-orange-50 text-orange-800 border-orange-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st.consumedSymbol}
                </button>
              ))}
            </div>

            {/* Live step readout */}
            {currentStep && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="tabular-nums">
                    Paso {safeCursor} de {trace.length - 1}
                  </span>
                  <span className="font-mono font-semibold text-slate-900">
                    Posiciones:{' '}
                    {currentStep.activeStates.length > 0
                      ? `{${currentStep.activeStates.join(', ')}}`
                      : '∅ (Ninguna)'}
                  </span>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed">{currentStep.narration}</p>

                {currentStep.activeStates.length > 1 && (
                  <div className="pt-2 border-t border-slate-200 text-xs text-sky-800 font-medium">
                    Clones simultáneos: estás en {currentStep.activeStates.length} andenes a la vez.
                    Convertir al AFD eliminará esta ambigüedad en un solo Súper-Andén.
                  </div>
                )}

                {isFinalStep && (
                  <div
                    className={`pt-2 border-t border-slate-200 text-xs font-semibold ${
                      acceptedAtEnd ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {acceptedAtEnd
                      ? `VEREDICTO: CADENA ACEPTADA — Al menos un clon llegó a {${spec.acceptStates.join(', ')}}.`
                      : `VEREDICTO: CADENA RECHAZADA — Ningún clon alcanzó {${spec.acceptStates.join(', ')}}.`}
                  </div>
                )}
              </div>
            )}

            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStepCursor(0)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar</span>
              </button>
              <button
                onClick={handleStepForward}
                disabled={isFinalStep}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <StepForward className="w-4 h-4" />
                <span>Siguiente boleto</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Root "Why?" Section */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Preguntas de raíz: ¿por qué surge este problema?
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Abre cada pregunta para entender la lógica sin tecnicismos innecesarios.
            </p>
          </div>
          <button
            onClick={onNextStage}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <span>Ir al Capítulo 2: Transbordos (ε-C)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 mt-2">
          {ROOT_WHY_QUESTIONS.slice(0, 3).map((item) => {
            const isOpen = openWhyId === item.id;
            return (
              <div key={item.id} className="py-3.5">
                <button
                  onClick={() => setOpenWhyId(isOpen ? '' : item.id)}
                  className="w-full flex items-start justify-between gap-4 text-left"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{item.question}</div>
                    <div className="text-xs text-slate-600 mt-1">{item.shortAnswer}</div>
                  </div>
                  <span className="p-1 text-slate-400 shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>
                {isOpen && (
                  <p className="mt-3 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3.5 leading-relaxed">
                    {item.deepExplanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
