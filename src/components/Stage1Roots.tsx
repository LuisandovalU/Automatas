import React, { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, RotateCcw, StepForward } from 'lucide-react';
import { MetroMapNFA } from './MetroMapNFA';
import { NFA_STATIONS, NfaState, ROOT_WHY_QUESTIONS, SymbolInput } from '../data/automataData';
import { metroAudio } from '../utils/metroAudio';
import { RegexLibrarySection } from './RegexLibrarySection';

interface SimulationStep {
  stepIndex: number;
  consumedSymbol: SymbolInput | 'Inicio';
  activeStates: NfaState[];
  highlightedEdges: string[];
  narration: string;
}

function epsilonClosureSet(states: NfaState[]): { result: NfaState[]; edges: string[] } {
  const visited = new Set<NfaState>(states);
  const edges: string[] = [];
  const queue: NfaState[] = [...states];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr === 'C') {
      if (!visited.has('D')) {
        visited.add('D');
        queue.push('D');
      }
      edges.push('C-e-D');
      if (!visited.has('F')) {
        visited.add('F');
        queue.push('F');
      }
      edges.push('C-e-F');
    } else if (curr === 'E') {
      if (!visited.has('D')) {
        visited.add('D');
        queue.push('D');
      }
      edges.push('E-e-D');
      if (!visited.has('F')) {
        visited.add('F');
        queue.push('F');
      }
      edges.push('E-e-F');
    }
  }

  return { result: Array.from(visited), edges };
}

function buildNfaTrace(input: string): SimulationStep[] {
  const initial = epsilonClosureSet(['A']);
  const steps: SimulationStep[] = [
    {
      stepIndex: 0,
      consumedSymbol: 'Inicio',
      activeStates: initial.result,
      highlightedEdges: initial.edges,
      narration:
        'Entras por Pantitlán (A). Como de A no sale ningún pasillo gratis (ε), estás únicamente en A.',
    },
  ];

  let current = initial.result;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i] as SymbolInput;
    const moved = new Set<NfaState>();
    const trainEdges: string[] = [];

    for (const st of current) {
      if (st === 'A' && ch === 'a') {
        moved.add('B');
        trainEdges.push('A-a-B');
      } else if (st === 'B' && ch === 'b') {
        moved.add('C');
        trainEdges.push('B-b-C');
      } else if (st === 'D' && ch === 'a') {
        moved.add('E');
        trainEdges.push('D-a-E');
      }
    }

    if (moved.size === 0) {
      steps.push({
        stepIndex: i + 1,
        consumedSymbol: ch,
        activeStates: [],
        highlightedEdges: [],
        narration: `Mostraste el boleto "${ch}", pero ninguna de tus posiciones actuales (${current.join(', ')}) tiene tren "${ch}". El pasajero desaparece del mapa (camino muerto ∅).`,
      });
      current = [];
      continue;
    }

    const afterClosure = epsilonClosureSet(Array.from(moved));
    const movedList = Array.from(moved).join(', ');
    const closureList = afterClosure.result.join(', ');

    let narration = `Pagas boleto "${ch}" y el tren te deja en ${movedList}. `;
    if (afterClosure.result.length > moved.size) {
      narration += `¡Atención! Apenas pisas ${movedList}, los pasillos gratis (ε) te permiten clonarte y estar al mismo tiempo en {${closureList}}.`;
    } else {
      narration += `No hay pasillos gratis desde ${movedList}, así que sigues en {${closureList}}.`;
    }

    steps.push({
      stepIndex: i + 1,
      consumedSymbol: ch,
      activeStates: afterClosure.result,
      highlightedEdges: [...trainEdges, ...afterClosure.edges],
      narration,
    });
    current = afterClosure.result;
  }

  return steps;
}

const PRESET_EXAMPLES = [
  { label: 'ab', note: 'Mínimo válido' },
  { label: 'aba', note: 'Con 1 vuelta' },
  { label: 'abaa', note: 'Con 2 vueltas' },
  { label: 'a', note: 'Incompleto' },
  { label: 'abb', note: 'Boleto prohibido' },
];

export const Stage1Roots: React.FC<{ onNextStage: () => void }> = ({ onNextStage }) => {
  const [ticketString, setTicketString] = useState('aba');
  const [stepCursor, setStepCursor] = useState(0);
  const [selectedInspect, setSelectedInspect] = useState<NfaState>('C');
  const [openWhyId, setOpenWhyId] = useState<string>('why-epsilon');

  const trace = useMemo(() => buildNfaTrace(ticketString), [ticketString]);
  const safeCursor = Math.min(stepCursor, trace.length - 1);
  const currentStep = trace[safeCursor];
  const isFinalStep = safeCursor === trace.length - 1;
  const acceptedAtEnd = isFinalStep && currentStep.activeStates.includes('F');

  const handleSelectPreset = (str: string) => {
    setTicketString(str);
    setStepCursor(0);
    metroAudio.playTicketClick();
  };

  const handleAppendTicket = (ch: SymbolInput) => {
    if (ticketString.length >= 9) return;
    setTicketString((prev) => prev + ch);
    setStepCursor(0);
    metroAudio.playTicketClick();
  };

  const handleStepForward = () => {
    const nextIdx = Math.min(trace.length - 1, safeCursor + 1);
    setStepCursor(nextIdx);
    const nextStep = trace[nextIdx];
    if (nextStep.activeStates.length === 0) {
      metroAudio.playDeadEndBuzz();
    } else if (nextIdx === trace.length - 1 && nextStep.activeStates.includes('F')) {
      metroAudio.playValidExitChime();
    } else if (nextStep.activeStates.length > 1) {
      metroAudio.playTransferChime();
    } else {
      metroAudio.playTicketClick();
    }
  };

  const inspectedStation = NFA_STATIONS[selectedInspect];

  return (
    <div className="space-y-8">
      {/* Step 0: Library of Regex Types & ER -> Diagram -> Table */}
      <RegexLibrarySection />

      {/* Intro summary strip */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-xs font-medium text-slate-500">
              Capítulo 1 · La raíz del problema · Imagen 1
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1 text-balance">
              ¿Por qué los pasillos gratis (ε) confunden al torniquete del Metro?
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Imagina que la expresión <span className="font-mono font-semibold text-slate-900">(ab)a*</span> es
              una regla de viaje: primero debes pagar boleto <span className="font-mono font-semibold">a</span>, luego{' '}
              <span className="font-mono font-semibold">b</span>, y después puedes tomar cero, uno o muchos trenes{' '}
              <span className="font-mono font-semibold">a</span>. El mapa original usa{' '}
              <span className="font-semibold text-sky-700">pasillos peatonales gratis (ε)</span> para unir las piezas,
              pero eso provoca que un pasajero pueda estar en varios andenes a la vez.
            </p>
          </div>

          <MetroMapNFA
            activeStates={currentStep.activeStates}
            highlightedTransitions={currentStep.highlightedEdges}
            selectedStation={selectedInspect}
            onSelectStation={setSelectedInspect}
            caption="Haz clic en cualquier estación para inspeccionar su función, o usa el simulador de la derecha."
          />

          {/* Station Inspector Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500">
                Estación seleccionada · {inspectedStation.role}
              </div>
              <div className="text-base font-semibold text-slate-900 mt-0.5">
                {inspectedStation.id} — {inspectedStation.metroName}
              </div>
              <p className="text-sm text-slate-600 mt-1">{inspectedStation.description}</p>
            </div>
            <div className="shrink-0 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-right">
              <div className="text-xs text-slate-500">Transbordo gratis (ε-C)</div>
              <div className="text-base font-mono font-semibold text-sky-700">
                {'{' + inspectedStation.epsilonClosure.join(', ') + '}'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Control Deck: Ghost Passenger Simulator */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Simulador de Pasajero Fantasma
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Observa cómo en el AFN-ε un solo pasajero se multiplica en varios andenes.
              </p>
            </div>

            {/* Preset strings */}
            <div>
              <div className="text-xs font-medium text-slate-700 mb-2">
                Elige una tira de boletos:
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESET_EXAMPLES.map((ex) => (
                  <button
                    key={ex.label}
                    onClick={() => handleSelectPreset(ex.label)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-colors whitespace-nowrap ${
                      ticketString === ex.label
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom builder */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-600">
                Boletos:{' '}
                <span className="font-mono font-semibold text-slate-900 text-sm">
                  {ticketString || '—'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleAppendTicket('a')}
                  className="px-2.5 py-1.5 rounded-md text-xs font-mono font-semibold bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100"
                >
                  + a
                </button>
                <button
                  onClick={() => handleAppendTicket('b')}
                  className="px-2.5 py-1.5 rounded-md text-xs font-mono font-semibold bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100"
                >
                  + b
                </button>
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
                  Problema detectado: estás clonado en {currentStep.activeStates.length} andenes a la vez.
                  Un torniquete real no puede hacer eso.
                </div>
              )}

              {isFinalStep && (
                <div
                  className={`pt-2 border-t border-slate-200 text-xs font-semibold ${
                    acceptedAtEnd ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {acceptedAtEnd
                    ? 'VEREDICTO: VIAJE VÁLIDO — Al menos uno de tus clones llegó a la salida F.'
                    : 'VEREDICTO: VIAJE RECHAZADO — Ningún clon alcanzó la salida F.'}
                </div>
              )}
            </div>

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
