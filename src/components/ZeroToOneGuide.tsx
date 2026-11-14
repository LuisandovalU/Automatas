import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  Footprints,
  HeartHandshake,
  Lightbulb,
  Sparkles,
  Train,
} from 'lucide-react';
import { metroAudio } from '../utils/metroAudio';

interface ZeroToOneGuideProps {
  onGoToTableTab: () => void;
  onUnlockAll?: () => void;
}

interface MicroStoryStep {
  id: number;
  badge: string;
  title: string;
  analogyTitle: string;
  analogyBody: string;
  symbolTranslation: { symbol: string; humanMeaning: string; example: string }[];
  interactiveQuestion: string;
  options: { label: string; isCorrect: boolean; feedback: string }[];
}

const MICRO_STEPS: MicroStoryStep[] = [
  {
    id: 1,
    badge: 'Paso 1 de 4 · Cero tecnicismos',
    title: '¿De qué trata realmente este tema? (Sin palabras raras)',
    analogyTitle: 'Es solo un guardia de entrada revisando letras una por una',
    analogyBody:
      'Olvida la palabra "Autómata". Imagina que eres el guardia de un club secreto. La regla para dejar entrar a alguien es: tiene que decir "a", luego "b", y después puede repetir todas las "a" que quiera (o ninguna). Eso en corto se escribe: (ab)a*.',
    symbolTranslation: [
      {
        symbol: 'Circulito (A, B, C...)',
        humanMeaning: 'Un cuarto o estación donde estás parado.',
        example: 'Empiezas siempre en A (la entrada) y quieres llegar a F (la salida).',
      },
      {
        symbol: 'Flecha con "a" o "b"',
        humanMeaning: 'Puerta que te cobra un boleto ("a" o "b") para dejarte pasar.',
        example: 'Para ir de A a B tienes que entregar la letra "a".',
      },
      {
        symbol: '(ab)a*',
        humanMeaning: 'Obligatorio "ab" al inicio + el asterisco (*) significa "repite la a cero o más veces".',
        example: 'Sirven: "ab", "aba", "abaaaa". NO sirven: "a", "b", "abb".',
      },
    ],
    interactiveQuestion: 'Comprobación rápida: Con la regla (ab)a*, ¿la palabra "ab" solita (sin más "a" al final) es válida?',
    options: [
      {
        label: 'Sí, porque el asterisco (*) permite CERO repeticiones de la última "a"',
        isCorrect: true,
        feedback: '¡Exacto! (ab) es obligatorio y a* puede repetirse 0 veces. Por eso "ab" ya es ganadora.',
      },
      {
        label: 'No, a fuerza necesita otra "a" al final',
        isCorrect: false,
        feedback: 'Ojo: eso sería (ab)a+. El asterisco (*) significa que es 100% opcional (0, 1, 2... veces).',
      },
    ],
  },
  {
    id: 2,
    badge: 'Paso 2 de 4 · El famoso símbolo ε',
    title: '¿Qué demonios es la "ε" (épsilon) y por qué te clona?',
    analogyTitle: 'ε = Un tobogán o pasillo GRATIS (no te pide letra)',
    analogyBody:
      'Cuando dibujaron el mapa de (ab)a*, pusieron toboganes gratis (flechas con ε) saliendo de C y de E. Si tú caes en C, sin gastar ninguna letra más te puedes deslizar gratis hacia D y también hacia F. Como una computadora no sabe adivinar cuál camino te conviene, hace trampa: ¡se multiplica y se para en C, D y F al mismo tiempo!',
    symbolTranslation: [
      {
        symbol: 'ε (Épsilon)',
        humanMeaning: 'Camino GRATIS. Avanzas sin entregar ninguna letra.',
        example: 'De C hay flecha ε hacia D y flecha ε hacia F.',
      },
      {
        symbol: 'ε-C (Cerradura)',
        humanMeaning: '¿En qué cuartos puedo estar GRATIS si me dejan caer aquí?',
        example: 'Si caes en C, tu ε-C es {C, D, F} porque estás en C y resbalas gratis a D y a F.',
      },
      {
        symbol: '∅ (Conjunto vacío)',
        humanMeaning: 'Pared cerrada / No hay camino.',
        example: 'Si estás en A y quieres usar la letra "b", no hay puerta → pones ∅.',
      },
    ],
    interactiveQuestion: 'Mira el dibujo mental: en A solo hay una flecha con "a" hacia B (no hay flechas ε). ¿Cuál es la ε-C de A?',
    options: [
      {
        label: 'Solo A (porque no hay toboganes gratis ε saliendo de A)',
        isCorrect: true,
        feedback: '¡Brillante! Siempre te cuentas a ti mismo (A), y como no hay flechas ε, te quedas solo en A.',
      },
      {
        label: 'A y B',
        isCorrect: false,
        feedback: 'Casi: para ir de A a B te cobran la letra "a". Como ε-C pregunta solo por caminos GRATIS (ε), te quedas en A.',
      },
    ],
  },
  {
    id: 3,
    badge: 'Paso 3 de 4 · El truco de la tabla',
    title: 'Cómo llenar la Tabla sin pensar (La receta de 3 pasos)',
    analogyTitle: 'Toda la tabla gigante se llena con el mismo chiste de 3 pasos',
    analogyBody:
      'Los profesores ponen columnas con nombres horribles como ε-C, δ(x,a) y ε-C otra vez. Pero en español humano son solo 3 preguntas seguidas:',
    symbolTranslation: [
      {
        symbol: '1° Columna ε-C',
        humanMeaning: '¿Dónde estoy parado ahorita (incluyendo toboganes gratis)?',
        example: 'En la fila C, estás en: C, D, F.',
      },
      {
        symbol: '2° Columna δ(x, a)',
        humanMeaning: 'De esos lugares donde estoy, ¿quién tiene puerta con la letra "a" y a dónde me lleva?',
        example: 'De {C, D, F}, solo D tiene puerta "a" y te lleva al cuarto E.',
      },
      {
        symbol: '3° Columna ε-C final',
        humanMeaning: 'Al aterrizar en ese cuarto nuevo (E), ¿a dónde resbalo GRATIS?',
        example: 'Aterrizaste en E, y desde E resbalas gratis a D y F → Resultado final: E, D, F.',
      },
    ],
    interactiveQuestion: 'Si en el paso 2 aterrizas en C (después de pagar "b" desde B), ¿qué pones en la 3° columna (resbalón gratis al llegar a C)?',
    options: [
      {
        label: 'C, D, F (porque al tocar C resbalas gratis a D y a F)',
        isCorrect: true,
        feedback: '¡Lo tienes! Por eso en la fila B con la letra "b" el resultado final es C,D,F.',
      },
      {
        label: 'Solo C',
        isCorrect: false,
        feedback: 'Recuerda que apenas pisas C, se activan sus dos toboganes gratis ε hacia D y hacia F.',
      },
    ],
  },
  {
    id: 4,
    badge: 'Paso 4 de 4 · El final del ejercicio',
    title: '¿Por qué al final ponemos corchetes como [C,D,F]?',
    analogyTitle: 'Pegamos a tus clones con cinta adhesiva en un solo "Súper-Cuarto"',
    analogyBody:
      'A las computadoras reales no les gusta estar divididas en 3 cuartos a la vez (C, D y F). Entonces hacemos un truco genial: metemos a C, D y F dentro de unos corchetes [C,D,F] y decimos que ese paquete entero es UN SOLO cuarto nuevo. ¡Y listo! Ya tienes tu AFD terminado.',
    symbolTranslation: [
      {
        symbol: '[C,D,F] y [E,D,F]',
        humanMeaning: 'Paquetes de cuartos que visitaste juntos en la tabla anterior.',
        example: 'En vez de sufrir con 3 clones, tratas a [C,D,F] como una sola estación.',
      },
      {
        symbol: 'EF = 1 (Salida válida)',
        humanMeaning: '¿Este paquete tiene adentro a la salida F?',
        example: 'Como [C,D,F] y [E,D,F] tienen la letra F adentro, ambos tienen permiso de salida (EF = 1).',
      },
      {
        symbol: '[∅] (El basurero)',
        humanMeaning: 'A dónde mandas al usuario cuando mete una letra prohibida.',
        example: 'Si estás en [A] y meten una "b", cae a [∅] y de ahí nunca sale.',
      },
    ],
    interactiveQuestion: 'Última pregunta para graduarte: ¿Cómo sabes rápido si un paquete como [E,D,F] es Estado Final (EF = 1)?',
    options: [
      {
        label: 'Solo miro si trae la letra F (la salida original) adentro del corchete',
        isCorrect: true,
        feedback: '¡BINGO! Si el paquete incluye la salida F (o un estado con salida gratis a F), automáticamente vale EF = 1.',
      },
      {
        label: 'Tengo que hacer ecuaciones difíciles',
        isCorrect: false,
        feedback: '¡Para nada! Es puramente visual: ¿tiene a F adentro? Sí → ponle un 1 y doble círculo.',
      },
    ],
  },
];

export const ZeroToOneGuide: React.FC<ZeroToOneGuideProps> = ({
  onGoToTableTab,
  onUnlockAll,
}) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() => new Set());
  const [simStep, setSimStep] = useState<0 | 1 | 2 | 3>(0);

  const current = MICRO_STEPS[stepIdx];

  const handleSelectOption = (idx: number) => {
    setSelectedOption(idx);
    const opt = current.options[idx];
    if (opt.isCorrect) {
      metroAudio.playValidExitChime();
      const next = new Set(completedSteps);
      next.add(current.id);
      setCompletedSteps(next);
      if (next.size === MICRO_STEPS.length) {
        onUnlockAll?.();
      }
    } else {
      metroAudio.playDeadEndBuzz();
    }
  };

  const goNextStep = () => {
    if (stepIdx < MICRO_STEPS.length - 1) {
      setStepIdx(stepIdx + 1);
      setSelectedOption(null);
      metroAudio.playTicketClick();
    } else {
      onUnlockAll?.();
      onGoToTableTab();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* EMPATHETIC BANNER */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-rose-500/15 border-2 border-amber-300 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide bg-amber-200 text-amber-950 mb-1">
                Modo Salvavidas · Explicado para humanos
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                No eres tú: este tema lo explican horrible en clase
              </h2>
              <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                Los profes usan letras griegas (<span className="font-mono font-bold">ε, δ, ∅</span>) para algo que en realidad es como{' '}
                <strong>jugar a las escondidas en cuartos con toboganes gratis</strong>. Vamos a traducirlo en 4 pasos de 30 segundos.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE VISUAL MINI-TOY: SEE THE CLONING WITH 1 BUTTON */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-orange-400">
              Mini-Película Interactiva (Toca el botón naranja)
            </div>
            <h3 className="text-lg font-bold text-white">
              Mira qué pasa cuando metes las letras "a", luego "b" y luego "a"
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = ((simStep + 1) % 4) as 0 | 1 | 2 | 3;
                setSimStep(next);
                if (next === 2 || next === 3) metroAudio.playTransferChime();
                else metroAudio.playTicketClick();
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-orange-500 text-white hover:bg-orange-400 shadow-md transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {simStep === 0 && '1. Pagar letra "a" →'}
                {simStep === 1 && '2. Pagar letra "b" (¡Ver clonación!) →'}
                {simStep === 2 && '3. Pagar otra "a" (Ver bucle) →'}
                {simStep === 3 && 'Reiniciar película ↺'}
              </span>
            </button>
          </div>
        </div>

        {/* ULTRA-CLEAR 2D DIAGRAM WITH BIG CALLOUTS */}
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 overflow-x-auto">
          <svg viewBox="0 0 780 185" className="w-full min-w-[640px] h-auto">
            <defs>
              <marker id="arr-orange" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill="#f97316" />
              </marker>
              <marker id="arr-sky" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill="#38bdf8" />
              </marker>
            </defs>

            {/* Paid transitions (orange solid) */}
            <line x1="115" y1="95" x2="195" y2="95" stroke="#f97316" strokeWidth="4" markerEnd="url(#arr-orange)" />
            <text x="155" y="82" textAnchor="middle" fill="#fdba74" fontSize="13" fontWeight="bold">
              Paga "a"
            </text>

            <line x1="255" y1="95" x2="335" y2="95" stroke="#f97316" strokeWidth="4" markerEnd="url(#arr-orange)" />
            <text x="295" y="82" textAnchor="middle" fill="#fdba74" fontSize="13" fontWeight="bold">
              Paga "b"
            </text>

            <line x1="505" y1="95" x2="585" y2="95" stroke="#f97316" strokeWidth="4" markerEnd="url(#arr-orange)" />
            <text x="545" y="82" textAnchor="middle" fill="#fdba74" fontSize="13" fontWeight="bold">
              Paga "a"
            </text>

            {/* Free slides (sky dashed) */}
            <line x1="395" y1="95" x2="445" y2="95" stroke="#38bdf8" strokeWidth="3.5" strokeDasharray="6 4" markerEnd="url(#arr-sky)" />
            <text x="420" y="82" textAnchor="middle" fill="#7dd3fc" fontSize="12" fontWeight="bold">
              ε GRATIS
            </text>

            {/* C to F long free slide below */}
            <path d="M 365 125 Q 540 180 705 125" fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeDasharray="6 4" markerEnd="url(#arr-sky)" />
            <text x="535" y="168" textAnchor="middle" fill="#7dd3fc" fontSize="12" fontWeight="bold">
              ε Tobogán GRATIS directo a la Salida F
            </text>

            {/* E to D loop back above */}
            <path d="M 615 65 Q 545 15 475 65" fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeDasharray="6 4" markerEnd="url(#arr-sky)" />
            <text x="545" y="28" textAnchor="middle" fill="#7dd3fc" fontSize="12" fontWeight="bold">
              ε Regreso GRATIS para repetir otra "a"
            </text>

            {/* E to F free slide */}
            <line x1="645" y1="95" x2="695" y2="95" stroke="#38bdf8" strokeWidth="3.5" strokeDasharray="6 4" markerEnd="url(#arr-sky)" />
            <text x="670" y="82" textAnchor="middle" fill="#7dd3fc" fontSize="12" fontWeight="bold">
              ε GRATIS
            </text>

            {/* Nodes */}
            {[
              { id: 'A', x: 85, label: 'Inicio', active: simStep === 0 },
              { id: 'B', x: 225, label: 'Paso 1', active: simStep === 1 },
              { id: 'C', x: 365, label: 'Clon 1', active: simStep === 2 },
              { id: 'D', x: 475, label: 'Clon 2', active: simStep === 2 || simStep === 3 },
              { id: 'E', x: 615, label: 'Bucle', active: simStep === 3 },
              { id: 'F', x: 725, label: 'SALIDA', active: simStep === 2 || simStep === 3, isExit: true },
            ].map((node) => (
              <g key={node.id} transform={`translate(${node.x}, 95)`}>
                {node.active && (
                  <circle r="34" fill={node.isExit ? '#10b981' : '#f97316'} opacity="0.28" />
                )}
                <circle
                  r="26"
                  fill={node.active ? (node.isExit ? '#059669' : '#ea580c') : '#1e293b'}
                  stroke={node.active ? '#ffffff' : '#64748b'}
                  strokeWidth="3"
                />
                {node.isExit && <circle r="21" fill="none" stroke="#a7f3d0" strokeWidth="2" />}
                <text y="5" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="bold">
                  {node.id}
                </text>
                <text y="42" textAnchor="middle" fill={node.active ? '#fde047' : '#94a3b8'} fontSize="11" fontWeight="bold">
                  {node.active ? '¡ESTÁS AQUÍ!' : node.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* HUMAN EXPLANATION OF CURRENT FRAME */}
        <div className="rounded-xl bg-slate-800/90 border border-slate-700 p-4 flex items-start gap-3">
          <Footprints className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            {simStep === 0 && (
              <>
                <strong className="text-amber-300">Inicio (Sin pagar nada):</strong> Empiezas parado únicamente en el cuarto{' '}
                <strong className="text-white">A</strong>. Como de A no sale ninguna flecha azul gratis (<span className="font-mono text-sky-300">ε</span>), no puedes moverte gratis a ningún lado.
              </>
            )}
            {simStep === 1 && (
              <>
                <strong className="text-amber-300">Pagaste "a":</strong> Cruzaste la puerta naranja de A hacia{' '}
                <strong className="text-white">B</strong>. De B tampoco salen flechas azules gratis, así que estás parado solo en{' '}
                <strong className="text-white">B</strong> esperando una "b".
              </>
            )}
            {simStep === 2 && (
              <>
                <strong className="text-emerald-300">¡Pagaste "b" y te clonaste en {'{C, D, F}'}!</strong> La puerta "b" te dejó en{' '}
                <strong className="text-white">C</strong>. Pero mira las flechas azules punteadas: sin pagar nada más, te deslizas gratis a{' '}
                <strong className="text-white">D</strong> y también directo a la salida <strong className="text-emerald-300">F</strong>. ¡Por eso estás en{' '}
                <strong className="text-amber-300">C, D y F al mismo tiempo</strong>!
              </>
            )}
            {simStep === 3 && (
              <>
                <strong className="text-emerald-300">Pagaste otra "a" y quedaste en {'{E, D, F}'}:</strong> De los tres lugares donde estabas (C, D, F), el único que tenía puerta naranja "a" era{' '}
                <strong className="text-white">D</strong>, que te llevó a <strong className="text-white">E</strong>. Y al pisar E, las flechas azules gratis te regresan a{' '}
                <strong className="text-white">D</strong> (por si quieres meter otra "a") y te conectan a la salida{' '}
                <strong className="text-emerald-300">F</strong>.
              </>
            )}
          </div>
        </div>
      </div>

      {/* STEP SELECTOR PILLS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {MICRO_STEPS.map((s, idx) => {
          const isDone = completedSteps.has(s.id);
          const isCurrent = idx === stepIdx;
          return (
            <button
              key={s.id}
              onClick={() => {
                setStepIdx(idx);
                setSelectedOption(null);
                metroAudio.playTicketClick();
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : isDone
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Paso {s.id}</span>
                {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <div className="text-xs font-medium mt-1 line-clamp-1 opacity-90">
                {s.id === 1 && '¿Qué es esto?'}
                {s.id === 2 && 'El tobogán ε'}
                {s.id === 3 && 'Receta de 3 pasos'}
                {s.id === 4 && 'Súper-Cuartos [ ]'}
              </div>
            </button>
          );
        })}
      </div>

      {/* CURRENT STEP CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm space-y-6">
        <div>
          <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-100 text-orange-900">
            {current.badge}
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {current.title}
          </h3>
        </div>

        {/* Analogy Box */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Lightbulb className="w-4 h-4 text-orange-600 shrink-0" />
            <span>{current.analogyTitle}</span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            {current.analogyBody}
          </p>
        </div>

        {/* Symbol Translator Dictionary */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Traductor de Chino a Español:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {current.symbolTranslation.map((item) => (
              <div
                key={item.symbol}
                className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-1.5"
              >
                <div className="font-mono text-sm font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded inline-block">
                  {item.symbol}
                </div>
                <p className="text-xs font-semibold text-slate-900 leading-snug">
                  {item.humanMeaning}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ej: {item.example}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Micro Check Question */}
        <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-4 sm:p-5 space-y-3">
          <div className="text-sm font-bold text-slate-900">
            {current.interactiveQuestion}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {current.options.map((opt, idx) => {
              const isPicked = selectedOption === idx;
              return (
                <button
                  key={opt.label}
                  onClick={() => handleSelectOption(idx)}
                  className={`p-3.5 rounded-xl border text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isPicked
                      ? opt.isCorrect
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        : 'bg-rose-600 text-white border-rose-700'
                      : 'bg-white text-slate-800 border-slate-300 hover:border-orange-400 hover:bg-orange-50/40'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {selectedOption !== null && (
            <div
              className={`rounded-lg p-3 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 ${
                current.options[selectedOption].isCorrect
                  ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                  : 'bg-rose-100 text-rose-950 border border-rose-300'
              }`}
            >
              <span>{current.options[selectedOption].feedback}</span>
              {current.options[selectedOption].isCorrect && (
                <button
                  onClick={goNextStep}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shrink-0 cursor-pointer"
                >
                  <span>{stepIdx < MICRO_STEPS.length - 1 ? 'Siguiente paso' : 'Ver Tabla Resuelta'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            onClick={() => {
              if (stepIdx > 0) {
                setStepIdx(stepIdx - 1);
                setSelectedOption(null);
              }
            }}
            disabled={stepIdx === 0}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
          >
            ← Paso anterior
          </button>

          <button
            onClick={goNextStep}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-orange-600 text-white hover:bg-orange-700 shadow-xs cursor-pointer"
          >
            <span>
              {stepIdx < MICRO_STEPS.length - 1
                ? `Ir al Paso ${stepIdx + 2} de 4`
                : '¡Ya entendí! Llenar la tabla ahora'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
