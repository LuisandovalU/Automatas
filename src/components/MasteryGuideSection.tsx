import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  HelpCircle,
  Layers,
  Lightbulb,
  Sparkles,
  Zap,
} from 'lucide-react';
import { metroAudio } from '../utils/metroAudio';

interface JargonItem {
  symbol: string;
  academicName: string;
  metroAnalogy: string;
  plainMeaning: string;
  exampleInA2: string;
}

const JARGON_DICTIONARY: JargonItem[] = [
  {
    symbol: 'Σ (Alfabeto)',
    academicName: 'Conjunto finito de símbolos de entrada',
    metroAnalogy: 'Tipos de boletos válidos que aceptan los torniquetes',
    plainMeaning: 'Las únicas letras que existen en tu problema. Cualquier otra letra es rechazada de inmediato.',
    exampleInA2: 'Σ = {a, b}. En "abas", la "s" ni siquiera existe en Σ.',
  },
  {
    symbol: 'q ∈ Q (Estado)',
    academicName: 'Estado del autómata',
    metroAnalogy: 'Andén o estación del Metro CDMX',
    plainMeaning: 'El lugar donde estás parado esperando tu siguiente boleto. Recuerda qué parte de la palabra ya cumpliste.',
    exampleInA2: 'A (Pantitlán), B (Pino Suárez), C (Tacubaya), D (Chabacano), E (Hidalgo), F (Zócalo).',
  },
  {
    symbol: 'ε (Épsilon)',
    academicName: 'Transición vacía / sin consumo de entrada',
    metroAnalogy: 'Pasillo de transbordo peatonal GRATIS',
    plainMeaning: 'Un puente por el que caminas a otra estación al instante SIN gastar ninguna letra de tu palabra.',
    exampleInA2: 'De C caminas gratis por ε hacia D y hacia F.',
  },
  {
    symbol: 'ε-C(q)',
    academicName: 'Cerradura Épsilon de un estado q',
    metroAnalogy: 'Todos los andenes que pisas gratis desde tu estación',
    plainMeaning: 'Lista de estaciones a las que puedes llegar usando SOLO flechas ε (¡incluyendo siempre donde ya estás parado!).',
    exampleInA2: 'ε-C(C) = {C, D, F}. ε-C(A) = {A}.',
  },
  {
    symbol: 'δ(q, a)',
    academicName: 'Función de transición con símbolo a',
    metroAnalogy: 'A qué estación te lleva el tren cuando pagas el boleto "a"',
    plainMeaning: 'Mirar en el dibujo qué flecha con la letra "a" sale de tu estación.',
    exampleInA2: 'δ(A, a) = B. Pero δ(A, b) = ∅ (no hay tren "b" en A).',
  },
  {
    symbol: 'EF = 1 / F',
    academicName: 'Estado Final o de Aceptación (doble círculo)',
    metroAnalogy: 'Torniquete de salida a la calle',
    plainMeaning: 'Si cuando se te acaban las letras de tu palabra estás parado aquí, la palabra es VÁLIDA (Aceptada).',
    exampleInA2: 'Originalmente solo F=1. Al quitar ε, C, E y F tienen EF=1 porque desde C y E caminas gratis a F.',
  },
  {
    symbol: '[C,D,F]',
    academicName: 'Subconjunto / Macro-estado del AFD',
    metroAnalogy: 'Súper-Estación que fusiona varios andenes en uno solo',
    plainMeaning: 'En vez de estar "clonado" en C, D y F, creamos un solo edificio llamado [C,D,F] para que el mapa sea 100% predecible.',
    exampleInA2: 'Al pagar "b" en [B], aterrizas en la súper-estación [C,D,F].',
  },
  {
    symbol: '∅ vs [∅]',
    academicName: 'Conjunto vacío vs Estado Pozo (Sumidero)',
    metroAnalogy: '"No hay vía" (∅) vs "Vía Muerta / Taller sin salida" ([∅])',
    plainMeaning: 'En AFN, ∅ significa que no hay flecha. En AFD como es obligatorio poner flecha para todo, ∅ se convierte en un cuarto de castigo [∅] del que nunca sales.',
    exampleInA2: 'En [A] con "b" vas a [∅], y estando en [∅] tanto "a" como "b" se quedan en [∅].',
  },
];

interface GoldenRule {
  step: number;
  title: string;
  badge: string;
  formula: string;
  humanRule: string;
  secretTip: string;
}

const GOLDEN_RULES: GoldenRule[] = [
  {
    step: 1,
    title: 'Identifica las piezas de la Expresión Regular (ER → AFN-ε)',
    badge: 'Paso 1 · Dibujo',
    formula: '(ab)a*  =  [A —a→ B —b→ C]  +  [C —ε→ D ⇄a/ε E —ε→ F]',
    humanRule:
      'Letras pegadas (ab) son estaciones en fila india. El asterisco (*) siempre usa 4 puentes gratis ε (entrar, regresar para repetir, salir y un atajo por abajo para saltar 0 veces).',
    secretTip: 'Si ves "+" en vez de "*", es idéntico pero SIN el puente ε de abajo (te obliga a pasar al menos 1 vez).',
  },
  {
    step: 2,
    title: 'Calcula la Columna 1: ε-C (Tu alcance gratis)',
    badge: 'Paso 2 · ε-Cerradura',
    formula: 'ε-C(x) = { x } ∪ { todos los alcanzables por flechas ε }',
    humanRule:
      'Pon tu dedo en la estación x. Anota primero a la propia x, y luego sigue todas las flechas punteadas ε que salgan de ahí.',
    secretTip: '¡Jamás olvides incluir la letra de la fila! ε-C(A) nunca es ∅, siempre es al menos {A}.',
  },
  {
    step: 3,
    title: 'Aplica la "Fórmula Sándwich" de 3 pasos para cada letra',
    badge: 'Paso 3 · Tabla AFN',
    formula: 'AFN(x, letra)  =  1. ε-C(x)   →   2. δ(eso, letra)   →   3. ε-C(resultado)',
    humanRule:
      '1) Mira dónde estás gratis antes de pagar. 2) Toma el tren de esa letra. 3) En la estación donde aterrizaste, vuelve a caminar gratis por todos los pasillos ε.',
    secretTip: 'En el paso 2 solo miras flechas con la letra ("a" o "b"). En los pasos 1 y 3 solo miras flechas ε.',
  },
  {
    step: 4,
    title: 'Actualiza quién es Salida Válida (EF nuevo)',
    badge: 'Paso 4 · Salidas EF',
    formula: 'Si  F ∈ ε-C(x)   ⇒   EF_nuevo(x) = 1',
    humanRule:
      'Revisa la columna 1 (ε-C). Todo estado que tenga a la meta F dentro de su ε-C se convierte automáticamente en salida válida (EF = 1).',
    secretTip: 'En nuestro ejercicio, C tiene ε-C = {C,D,F} y E tiene ε-C = {E,D,F}. ¡Por eso C, E y F tienen EF = 1!',
  },
  {
    step: 5,
    title: 'Construye las Súper-Estaciones con Corchetes (AFN → AFD)',
    badge: 'Paso 5 · AFD Final',
    formula: '[S] —letra→ [ Unión de AFN(x, letra) para cada x ∈ S ]',
    humanRule:
      'Empieza solo con [A]. Cada vez que en la tabla aparezca un paquete nuevo (como C,D,F), conviértelo en una nueva fila [C,D,F]. Si sale ∅, mándalo a la Vía Muerta [∅].',
    secretTip: 'No pongas filas para [D] ni [F] solos si nadie llega a ellos desde [A]. Solo existen las filas alcanzables.',
  },
];

interface ExamTrap {
  id: string;
  mistake: string;
  whyWrong: string;
  howToFix: string;
}

const EXAM_TRAPS: ExamTrap[] = [
  {
    id: 'trap1',
    mistake: 'Poner que ε-C(A) = ∅ porque de A no salen flechas ε',
    whyWrong: 'Si estás parado en A y no te mueves, ¡sigues estando en A!',
    howToFix: 'La cerradura ε-C(x) SIEMPRE empieza con la misma letra x: ε-C(A) = A, ε-C(B) = B, ε-C(D) = D.',
  },
  {
    id: 'trap2',
    mistake: 'Olvidar el paso 3 del sándwich (dejar que B con "b" va solo a C en vez de C,D,F)',
    whyWrong: 'Cuando el tren "b" te deja en C, los pasillos ε de C se activan al instante sin pedir otro boleto.',
    howToFix: 'Cada vez que aterrices de un tren (paso 2), pregúntate: "¿cuál es la ε-C de donde caí?" (paso 3).',
  },
  {
    id: 'trap3',
    mistake: 'Dejar que solo F tenga EF = 1 al pasar a AFN sin ε',
    whyWrong: 'Si borras los pasillos ε y no haces finales a C y E, palabras válidas como "ab" o "aba" serían rechazadas.',
    howToFix: 'Mira quién puede tocar a F gratis en la columna ε-C. Esos estados heredan el permiso de salida (EF = 1).',
  },
  {
    id: 'trap4',
    mistake: 'Hacer filas en el AFD para [A], [B], [C], [D], [E], [F] por separado',
    whyWrong: 'Desde [A] jamás llegas a C, D, E o F sueltos; siempre llegas en paquete [C,D,F] o [E,D,F].',
    howToFix: 'En el AFD solo agregas una fila nueva cuando ese conjunto exacto aparece como resultado a la derecha.',
  },
];

interface DrillItem {
  id: string;
  level: 'Básico' | 'Intermedio' | 'Master Examen';
  question: string;
  hint: string;
  options: string[];
  correctIdx: number;
  feedback: string;
}

const MASTER_DRILLS: DrillItem[] = [
  {
    id: 'd1',
    level: 'Básico',
    question: 'En cualquier autómata AFN-ε, si el estado X no tiene ninguna flecha ε saliendo de él, ¿cuánto vale ε-C(X)?',
    hint: 'Recuerda la Regla de Oro #2: ¿dónde estás parado si no caminas?',
    options: ['∅ (Vacío)', '{X} (El mismo estado X)', 'Todos los estados del mapa', 'Depende de la letra "a"'],
    correctIdx: 1,
    feedback: '¡Exacto! Siempre te alcanzas a ti mismo con 0 pasos. Jamás pongas ∅ en la primera columna ε-C.',
  },
  {
    id: 'd2',
    level: 'Básico',
    question: '¿Cómo distingues en 2 segundos el diagrama de (a*) contra el de (a+)?',
    hint: 'Piensa si puedes llegar a la salida con CERO letras "a".',
    options: [
      'Son exactamente iguales.',
      'a* tiene un puente ε largo por abajo que salta directo a la salida; a+ NO tiene ese atajo.',
      'a+ no tiene flecha de regreso.',
      'a* usa la letra b.',
    ],
    correctIdx: 1,
    feedback: '¡Brillante! El asterisco (*) acepta 0 repeticiones gracias al puente ε inferior; el más (+) exige mínimo 1 paso.',
  },
  {
    id: 'd3',
    level: 'Intermedio',
    question: 'En nuestra tabla AFN (Imagen 2), ¿por qué la fila C con boleto "a" da como resultado final {E,D,F}?',
    hint: 'Aplica el sándwich: 1) ε-C(C)={C,D,F} → 2) ¿Quién tiene tren "a"? → 3) ε-C de donde aterrizas.',
    options: [
      'Porque de C sale un tren "a" directo a F.',
      'Porque en {C,D,F} el estado D toma tren "a" hacia E, y al pisar E caminas gratis a {E,D,F}.',
      'Porque C, D y F desaparecen.',
      'Porque es un error de la tabla.',
    ],
    correctIdx: 1,
    feedback: '¡Dominio total! C camina gratis a D; D toma el tren "a" hacia E; y en E los puentes ε te expanden a {E,D,F}.',
  },
  {
    id: 'd4',
    level: 'Master Examen',
    question: 'Supón que en un examen te sale la súper-estación [B, D] y sabes que en la tabla AFN: B con "a" → ∅ y D con "a" → {E,D,F}. ¿A dónde va [B, D] con "a" en el AFD?',
    hint: 'En un súper-estado unes (∪) los resultados de cada integrante. Unión con ∅ no agrega nada.',
    options: ['[∅]', '[B, E, D, F]', '[E,D,F]', '[D]'],
    correctIdx: 2,
    feedback: '¡Nivel Master! Unes ∅ ∪ {E,D,F} = [E,D,F]. Así de fácil se calcula cualquier fila de un AFD.',
  },
  {
    id: 'd5',
    level: 'Master Examen',
    question: '¿Cuándo le pones EF = 1 (doble círculo) a una súper-estación como [C,D,F] o [E,D,F] en el AFD?',
    hint: 'Basta con que UNO de los integrantes dentro del corchete tenga permiso de salida.',
    options: [
      'Solo si TODOS los estados dentro del corchete eran finales desde el principio.',
      'Si AL MENOS UNO de los estados dentro del corchete es estado final (por ejemplo F).',
      'Solo si empieza con la letra A.',
      'Cuando todas sus flechas van a [∅].',
    ],
    correctIdx: 1,
    feedback: '¡Perfecto! Si al menos un integrante del corchete puede salir a la calle (F), toda la súper-estación es salida válida (EF = 1).',
  },
];

export const MasteryGuideSection: React.FC<{ onCompletedMastery?: () => void }> = ({
  onCompletedMastery,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showHintId, setShowHintId] = useState<string | null>(null);

  const correctCount = MASTER_DRILLS.filter(
    (d) => selectedAnswers[d.id] === d.correctIdx
  ).length;

  const handleSelectAnswer = (drillId: string, optionIdx: number, correctIdx: number) => {
    const next = { ...selectedAnswers, [drillId]: optionIdx };
    setSelectedAnswers(next);
    if (optionIdx === correctIdx) {
      metroAudio.playValidExitChime();
      const totalRight = MASTER_DRILLS.filter((d) => next[d.id] === d.correctIdx).length;
      if (totalRight === MASTER_DRILLS.length) {
        onCompletedMastery?.();
      }
    } else {
      metroAudio.playDeadEndBuzz();
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Guía Definitiva 0 a 99% · Sin tecnicismos confusos
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
              Manual Maestro: Entiende Autómatas de por vida
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              No importa si hoy empiezas desde cero o si tienes examen mañana. Aquí tienes el{' '}
              <strong className="text-white">Traductor Cero-Jerga</strong>, la{' '}
              <strong className="text-white">Receta Infalible de 5 Pasos</strong> y las{' '}
              <strong className="text-white">Trampas de Examen</strong> explicadas con lógica pura del Metro CDMX.
            </p>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 min-w-[210px] text-center">
            <div className="text-xs text-slate-400">Reto Master Diagnosticado</div>
            <div className="text-3xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
              {correctCount}/{MASTER_DRILLS.length}
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              {correctCount === MASTER_DRILLS.length
                ? '¡Nivel Master 99% Desbloqueado!'
                : 'Responde el entrenamiento abajo'}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: THE 5 GOLDEN RULES (STEP-BY-STEP RECIPE) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              La Receta Infalible de 5 Pasos (De ER hasta AFD)
            </h3>
            <p className="text-xs text-slate-500">
              Sigue exactamente este orden en cualquier tarea o examen y jamás te perderás.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {GOLDEN_RULES.map((rule) => (
            <div
              key={rule.step}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-orange-600 text-white">
                    {rule.badge}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{rule.title}</h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {rule.humanRule}
                </p>
                <div className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1">
                  <Lightbulb className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Secreto de examen:</strong> {rule.secretTip}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 text-amber-300 font-mono text-xs px-3.5 py-2.5 rounded-lg border border-slate-800 shrink-0">
                {rule.formula}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: ZERO-JARGON TRANSLATOR TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Traductor Cero-Jerga: De "Símbolo Matemático" a "Español Claro"
            </h3>
            <p className="text-xs text-slate-500">
              Cada vez que veas un símbolo extraño en el pizarrón, esto es lo que realmente significa:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {JARGON_DICTIONARY.map((item) => (
            <div
              key={item.symbol}
              className="rounded-xl border border-slate-200 p-4 bg-white hover:border-slate-300 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono text-xs font-bold">
                  {item.symbol}
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  En clase: {item.academicName}
                </span>
              </div>

              <div className="text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200/80 rounded-lg px-2.5 py-1.5">
                🚇 En el Metro CDMX: {item.metroAnalogy}
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                <strong>En español simple:</strong> {item.plainMeaning}
              </p>

              <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-100">
                Ejemplo en (ab)a*: <span className="text-slate-800 font-semibold">{item.exampleInA2}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: TOP 4 EXAM TRAPS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Las 4 Trampas donde el 90% pierde puntos en el examen
            </h3>
            <p className="text-xs text-slate-500">
              Revísalas en 1 minuto para blindar tu calificación al 100%.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {EXAM_TRAPS.map((t, idx) => (
            <div key={t.id} className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 space-y-2">
              <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px]">
                  Trampa #{idx + 1}
                </span>
                <span>{t.mistake}</span>
              </div>
              <p className="text-xs text-slate-700">
                <strong className="text-rose-800">¿Por qué está mal?</strong> {t.whyWrong}
              </p>
              <div className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                <strong>✅ Cómo hacerlo bien:</strong> {t.howToFix}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: INTERACTIVE MASTER 99% EXAM SIMULATOR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Simulador de Examen "Master 99%" (5 Casos Reales)
              </h3>
              <p className="text-xs text-slate-500">
                Pon a prueba tu intuición. Cada respuesta te explica el razonamiento exacto.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 tabular-nums">
              Aciertos: {correctCount} / {MASTER_DRILLS.length}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {MASTER_DRILLS.map((drill, qIdx) => {
            const chosen = selectedAnswers[drill.id];
            const isCorrect = chosen === drill.correctIdx;

            return (
              <div
                key={drill.id}
                className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-900 text-white">
                      Caso {qIdx + 1}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        drill.level === 'Básico'
                          ? 'bg-sky-100 text-sky-800'
                          : drill.level === 'Intermedio'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      Nivel {drill.level}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      setShowHintId(showHintId === drill.id ? null : drill.id)
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-900"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showHintId === drill.id ? 'Ocultar pista' : 'Ver pista'}</span>
                  </button>
                </div>

                <p className="text-sm font-semibold text-slate-900 leading-snug">
                  {drill.question}
                </p>

                {showHintId === drill.id && (
                  <div className="text-xs text-sky-900 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2">
                    💡 <strong>Pista rápida:</strong> {drill.hint}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {drill.options.map((opt, oIdx) => {
                    const isSelected = chosen === oIdx;
                    let btnClass =
                      'bg-white border-slate-200 text-slate-800 hover:border-slate-400';
                    if (isSelected) {
                      btnClass = isCorrect
                        ? 'bg-emerald-600 border-emerald-700 text-white font-semibold'
                        : 'bg-rose-600 border-rose-700 text-white font-semibold';
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() =>
                          handleSelectAnswer(drill.id, oIdx, drill.correctIdx)
                        }
                        className={`text-left px-3.5 py-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between gap-2 ${btnClass}`}
                      >
                        <span>{opt}</span>
                        {isSelected && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {chosen !== undefined && (
                  <div
                    className={`rounded-lg px-3.5 py-2.5 text-xs border ${
                      isCorrect
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    {isCorrect ? (
                      <span>
                        <strong>¡Correcto!</strong> {drill.feedback}
                      </span>
                    ) : (
                      <span>
                        <strong>Intenta otra opción:</strong> Revisa la pista arriba. Recuerda aplicar la regla del sándwich o verificar si hay pasillo gratis ε.
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {correctCount === MASTER_DRILLS.length && (
          <div className="rounded-xl bg-emerald-900 text-white p-5 border border-emerald-700 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Certificación Master 99%+ Completada
                </div>
                <div className="text-base font-bold">
                  ¡Dominas ER, AFN-ε, ε-Cerradura, Tablas de Transición y AFD!
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono bg-emerald-950/80 px-3.5 py-2 rounded-lg border border-emerald-700">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Listo para cualquier examen</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
