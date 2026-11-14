import React, { useMemo, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Compass,
  Loader2,
  Send,
  Sparkles,
  TrainFront,
  Wand2,
  XCircle,
} from 'lucide-react';
import {
  buildNfaFromRegex,
  DEFAULT_EXERCISE_BUNDLE,
  PRESET_EXERCISES,
  solveAutomatonMethod,
  SolvedMethodBundle,
} from '../engine/automataMethodEngine';
import { metroAudio } from '../utils/metroAudio';

interface GeminiMetroLabProps {
  activeStageLabel?: string;
  bundle?: SolvedMethodBundle;
  onSelectBundle?: (bundle: SolvedMethodBundle) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  source?: 'gemini' | 'local';
}

interface ChallengeData {
  regex: string;
  title: string;
  metroStory: string;
  validSamples: string[];
  invalidSamples: string[];
  epsilonQuestion: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  source?: 'gemini' | 'local';
}

function answerLocallyFromBundle(question: string, bundle: SolvedMethodBundle): string {
  const q = question.toLowerCase();
  const { spec, stage2Rows, dfaOrder, dfaRows, dfaStartId, dfaHasTrapState, minimizedDfa } = bundle;

  if (q.includes('ef') || q.includes('final') || q.includes('doble') || q.includes('acept')) {
    const orig = `{${spec.acceptStates.join(', ')}}`;
    const promoted = stage2Rows.filter((r) => r.efNew === '1').map((r) => r.state);
    const dfaAccepts = dfaOrder.filter((id) => dfaRows[id]?.ef === '1');
    return (
      `En **${spec.title}**, los estados finales originales del diagrama AFN-ε son ${orig}. ` +
      `En la Lámina 2, cualquier estación cuya cerradura gratis \`ε-C(x)\` incluya al menos un estado final original hereda **EF nuevo = 1**: ` +
      `eso ocurre en **${promoted.join(', ')}**. ` +
      `Luego en la Lámina 3, todo Súper-Estado AFD que contenga alguno de esos miembros hereda **EF = 1** (**${dfaAccepts.join(', ')}**).`
    );
  }

  if (q.includes('pozo') || q.includes('vía muerta') || q.includes('via muerta') || q.includes('∅')) {
    if (!dfaHasTrapState) {
      return `En **${spec.title}**, ¡ninguna transición del AFD queda vacía! Por eso en este ejercicio no hace falta dibujar el Súper-Estado Pozo \`[∅]\`.`;
    }
    const entries = dfaOrder
      .filter((id) => id !== '[∅]')
      .flatMap((id) =>
        spec.alphabet
          .filter((sym) => dfaRows[id]?.transitions[sym] === '[∅]')
          .map((sym) => `\`${id} + ${sym}\``)
      );
    return (
      `En un AFD todas las estaciones deben tener exactamente una salida por cada boleto de Σ = {${spec.alphabet.join(', ')}}. ` +
      `Cuando una combinación cae en vacío (\`∅\`) —como ${entries.slice(0, 4).join(', ')}— en la Lámina 3 nace el Súper-Estado **\`[∅]\` (Vía Muerta)** con \`EF = ∅\` que se cicla consigo mismo para todos los símbolos.`
    );
  }

  if (q.includes('inicio') || q.includes('arranca') || q.includes('primer')) {
    const startRow = stage2Rows.find((r) => r.state === spec.startState);
    return (
      `El diagrama AFN-ε inicia en **\`${spec.startState}\`**, cuya cerradura épsilon es \`ε-C(${spec.startState}) = ${startRow?.epsilonC}\`. ` +
      (bundle.startHadEpsilonExpansion
        ? `Como \`${spec.startState}\` tiene salidas \`ε\` gratis antes de leer boletos, el Súper-Estado inicial del AFD es exactamente **\`${dfaStartId}\`**.`
        : `Como \`${spec.startState}\` no tiene pasillos \`ε\` salientes, \`ε-C(${spec.startState}) = {${spec.startState}}\` y el Súper-Estado inicial del AFD es **\`${dfaStartId}\`**.`)
    );
  }

  if (q.includes('minim') || q.includes('hopcroft')) {
    return (
      `El AFD por subconjuntos tiene **${dfaOrder.length} Súper-Estados**. Al aplicar el algoritmo de particiones de Hopcroft (separando primero \`EF = 1\` vs \`EF = ∅\` y refinando destinos), se obtiene un AFD mínimo de **${minimizedDfa.states.length} estados**. ${minimizedDfa.summary}`
    );
  }

  if (q.includes('ε') || q.includes('epsilon') || q.includes('cerradura') || q.includes('paso')) {
    const examples = stage2Rows
      .slice(0, 3)
      .map((r) => `\`ε-C(${r.state}) = ${r.epsilonC}\``)
      .join(', ');
    return (
      `La **regla de los 3 pasos** de la Lámina 2 para cualquier estación \`x\` y símbolo \`σ\` siempre hace: ` +
      `**1)** \`ε-C(x)\` (caminata gratis antes), **2)** \`δ(·, σ)\` (viaje en tren pagado), **3)** \`ε-C(...)\` (caminata gratis al bajar). ` +
      `Por ejemplo en **${spec.title}**: ${examples}.`
    );
  }

  // General subset / transition explanation
  const summaryRows = stage2Rows
    .slice(0, 4)
    .map(
      (r) =>
        `• **${r.state}** (\`ε-C=${r.epsilonC}\`, EF nuevo=${r.efNew}): ${spec.alphabet
          .map((s) => `${s}→${r.bySymbol[s].closure}`)
          .join(', ')}`
    )
    .join('\n');

  return (
    `Resumen en vivo del ejercicio **${spec.title}** (\`${spec.regex ?? 'AFN-ε personalizado'}\`):\n` +
    `${summaryRows}\n` +
    `Y el AFD resultante en orden BFS tiene **${dfaOrder.length} Súper-Estados**: \`${dfaOrder.join(' → ')}\`.`
  );
}

function buildLocalChallenge(regexStr: string): ChallengeData {
  const clean = regexStr.trim() || '(ab)a*';
  const spec = buildNfaFromRegex(clean, {
    id: `challenge-${clean}`,
    title: `Reto · ${clean}`,
    difficulty: 'Intermedio',
    description: `Ruta generada para la expresión regular ${clean}.`,
  });
  const solved = solveAutomatonMethod(spec);
  const valids = solved.testCases
    .filter((t) => t.expectedValid)
    .slice(0, 4)
    .map((t) => (t.text === '' ? 'ε' : t.text));
  const invalids = solved.testCases
    .filter((t) => !t.expectedValid)
    .slice(0, 4)
    .map((t) => (t.text === '' ? 'ε' : t.text));
  const q0 = solved.quizQuestions[0];

  return {
    regex: clean,
    title: `Ruta Metro "${clean}" (${solved.spec.states.length} andenes AFN-ε → ${solved.dfaOrder.length} Súper-Andenes AFD)`,
    metroStory: `Esta línea de Metro acepta exactamente las cadenas generadas por la expresión ${clean} usando el alfabeto Σ = {${solved.spec.alphabet.join(', ')}}. ${
      solved.startHadEpsilonExpansion
        ? `Ojo: desde el andén inicial ${solved.spec.startState} hay transbordos gratis ε hacia ${solved.dfaStartId}.`
        : `El tren parte desde ${solved.dfaStartId} con ${solved.dfaOrder.length} Súper-Estados en total.`
    }`,
    validSamples: valids.length > 0 ? valids : [solved.spec.alphabet.join('')],
    invalidSamples: invalids.length > 0 ? invalids : ['—'],
    epsilonQuestion:
      q0?.prompt ??
      `¿Cuántos Súper-Estados (incluyendo [∅] si existe) tiene el AFD generado para ${clean}?`,
    options:
      q0?.options ?? [
        `${solved.dfaOrder.length} Súper-Estados`,
        `${solved.dfaOrder.length + 2} Súper-Estados`,
        `1 Súper-Estado`,
      ],
    correctIndex: q0?.correctIndex ?? 0,
    explanation:
      q0?.explanation ??
      `El algoritmo de subconjuntos descubre exactamente: ${solved.dfaOrder.join(', ')}.`,
    source: 'local',
  };
}

export const GeminiMetroLab: React.FC<GeminiMetroLabProps> = ({
  activeStageLabel = 'Método de 4 Láminas',
  bundle = DEFAULT_EXERCISE_BUNDLE,
  onSelectBundle,
}) => {
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      source: 'local',
      text: `Hola, soy tu Tutor Metro Autómata. Estoy analizando "${bundle.spec.title}". Pregúntame cualquier "¿por qué?" de las 4 láminas o genera un reto nuevo abajo.`,
    },
  ]);

  const quickPrompts = useMemo(
    () => [
      `¿Por qué el AFD de ${bundle.spec.title} arranca en ${bundle.dfaStartId}?`,
      '¿Cómo se decide EF nuevo = 1 en la Lámina 2?',
      bundle.dfaHasTrapState
        ? '¿Por qué aparece el estado pozo [∅] en este AFD?'
        : '¿Por qué este AFD no necesita estado pozo [∅]?',
      '¿Qué hace exactamente la minimización de Hopcroft aquí?',
    ],
    [bundle]
  );

  const presetRegexOptions = useMemo(
    () =>
      PRESET_EXERCISES.filter((p) => p.regex).map((p) => ({
        label: `${p.regex} (${p.difficulty})`,
        regex: p.regex!,
      })),
    []
  );

  const [selectedRegex, setSelectedRegex] = useState<string>(
    bundle.spec.regex ?? '(a|b)*abb'
  );
  const [generating, setGenerating] = useState(false);
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [pickedOption, setPickedOption] = useState<number | null>(null);
  const [loadedBanner, setLoadedBanner] = useState<string | null>(null);

  const handleAsk = async (customText?: string) => {
    const qText = (customText ?? question).trim();
    if (!qText || asking) return;
    if (!customText) setQuestion('');

    const nextHistory: ChatMessage[] = [...messages, { role: 'user', text: qText }];
    setMessages(nextHistory);
    setAsking(true);
    metroAudio.playTicketClick();

    try {
      const res = await fetch('/api/ask-why', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: qText,
          activeStage: `${activeStageLabel} · ${bundle.spec.title} (${bundle.spec.regex ?? 'AFN-ε personalizado'})`,
          history: nextHistory.slice(-6),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data?.answer) throw new Error('Empty answer');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: data.answer, source: 'gemini' },
      ]);
      metroAudio.playTransferChime();
    } catch {
      const fallback = answerLocallyFromBundle(qText, bundle);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: fallback, source: 'local' },
      ]);
      metroAudio.playTransferChime();
    } finally {
      setAsking(false);
    }
  };

  const handleGenerateChallenge = async () => {
    if (generating) return;
    setGenerating(true);
    setPickedOption(null);
    setLoadedBanner(null);
    metroAudio.playTicketClick();

    try {
      const res = await fetch('/api/generate-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regex: selectedRegex }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data?.title || !Array.isArray(data?.options)) throw new Error('Invalid challenge');
      setChallenge({ ...data, source: 'gemini' });
      metroAudio.playValidExitChime();
    } catch {
      const localData = buildLocalChallenge(selectedRegex);
      setChallenge(localData);
      metroAudio.playValidExitChime();
    } finally {
      setGenerating(false);
    }
  };

  const handleLoadChallengeIntoApp = () => {
    if (!challenge || !onSelectBundle) return;
    try {
      const spec = buildNfaFromRegex(challenge.regex, {
        id: `tutor-${challenge.regex}-${Date.now()}`,
        title: `Reto Tutor · ${challenge.regex}`,
        difficulty: 'Intermedio',
        description: challenge.metroStory,
      });
      const solved = solveAutomatonMethod(spec);
      onSelectBundle(solved);
      setLoadedBanner(
        `¡Ruta "${challenge.regex}" cargada en el Mapa 3D y en los 4 Capítulos del método!`
      );
      metroAudio.playValidExitChime();
    } catch {
      // ignore invalid regex
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full mb-2">
              <Bot className="w-3.5 h-3.5" />
              <span>Tutor Híbrido (Gemini API + Motor Exacto Local)</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Capítulo 5: Tutor "¿Por qué?" y Generador de Retos
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Si hay API Key configurada usa Gemini en vivo; si estás sin conexión o en modo local,
              el motor exacto responde usando las tablas reales de <strong>{bundle.spec.title}</strong>.
            </p>
          </div>
          <div className="text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 shrink-0">
            Activo: <strong className="text-slate-900">{bundle.spec.title}</strong>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Chat Tutor */}
        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Compass className="w-4 h-4 text-orange-600" />
            <h3 className="text-base font-bold text-slate-900">Pregúntale "¿Por qué?" al Tutor</h3>
          </div>

          {/* Quick prompts */}
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((qp) => (
              <button
                key={qp}
                onClick={() => handleAsk(qp)}
                className="text-left px-2.5 py-1 rounded-md text-xs bg-slate-50 border border-slate-200 text-slate-700 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-900 transition-colors"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Chat messages */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`rounded-xl p-3.5 text-xs leading-relaxed whitespace-pre-line ${
                  m.role === 'user'
                    ? 'bg-slate-900 text-white ml-8'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 mr-4'
                }`}
              >
                <div className="flex items-center justify-between mb-1 opacity-75 text-[10px] font-semibold uppercase">
                  <span>{m.role === 'user' ? 'Tú' : 'Tutor Metro Autómata'}</span>
                  {m.source && (
                    <span>{m.source === 'gemini' ? 'Gemini en vivo' : 'Motor Exacto Local'}</span>
                  )}
                </div>
                {m.text}
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex items-center gap-2 pt-2 border-t border-slate-100"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ej: ¿Por qué C tiene EF nuevo = 1?"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="submit"
              disabled={asking || !question.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-40"
            >
              {asking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Preguntar</span>
            </button>
          </form>
        </section>

        {/* Right: Practice Generator */}
        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Wand2 className="w-4 h-4 text-sky-600" />
            <h3 className="text-base font-bold text-slate-900">Generador de Retos por ER</h3>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Elige una expresión o escribe cualquiera (soporta `|`, `*`, `+`, `?`, `()`):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {presetRegexOptions.map((opt) => (
                <button
                  key={opt.regex}
                  onClick={() => setSelectedRegex(opt.regex)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono border ${
                    selectedRegex === opt.regex
                      ? 'bg-sky-600 text-white border-sky-600 font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {opt.regex}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={selectedRegex}
                onChange={(e) => setSelectedRegex(e.target.value)}
                placeholder="Ej: (a|b)*abb"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                onClick={handleGenerateChallenge}
                disabled={generating}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40"
              >
                {generating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Generar reto</span>
              </button>
            </div>
          </div>

          {!challenge && (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-6 text-center space-y-2">
              <TrainFront className="w-7 h-7 text-slate-400 mx-auto" />
              <div className="text-sm font-medium text-slate-800">
                Selecciona o escribe una expresión y pulsa «Generar reto»
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Crearemos una historia tipo Metro CDMX, cadenas aceptadas/rechazadas, un acertijo y podrás cargarlo en toda la app 3D.
              </p>
            </div>
          )}

          {challenge && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-mono font-semibold text-orange-700">
                    Ruta: {challenge.regex} ·{' '}
                    <span className="text-slate-500">
                      ({challenge.source === 'gemini' ? 'Gemini AI' : 'Motor Exacto'})
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-slate-900 mt-0.5">{challenge.title}</h4>
                </div>
                {onSelectBundle && (
                  <button
                    onClick={handleLoadChallengeIntoApp}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-600 text-white hover:bg-orange-700 shrink-0"
                  >
                    <TrainFront className="w-3.5 h-3.5" />
                    <span>Cargar ruta en toda la app</span>
                  </button>
                )}
              </div>

              {loadedBanner && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 text-xs font-semibold text-emerald-800">
                  {loadedBanner}
                </div>
              )}

              <p className="text-sm text-slate-700 leading-relaxed">{challenge.metroStory}</p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white border border-slate-200 rounded-md p-2.5">
                  <div className="font-semibold text-emerald-800 mb-1">Boletos válidos</div>
                  <div className="font-mono text-slate-800">
                    {challenge.validSamples.join(' · ')}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-md p-2.5">
                  <div className="font-semibold text-rose-800 mb-1">Caen a [∅] / Rechazados</div>
                  <div className="font-mono text-slate-800">
                    {challenge.invalidSamples.join(' · ')}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="text-sm font-semibold text-slate-900">{challenge.epsilonQuestion}</div>
                <div className="space-y-1.5">
                  {challenge.options.map((opt, idx) => {
                    const answered = pickedOption !== null;
                    const isRight = idx === challenge.correctIndex;
                    const isPicked = idx === pickedOption;

                    let cls = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100';
                    if (answered) {
                      if (isRight) cls = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold';
                      else if (isPicked) cls = 'bg-rose-50 border-rose-400 text-rose-900';
                      else cls = 'bg-white border-slate-200 text-slate-400';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setPickedOption(idx);
                          if (idx === challenge.correctIndex) metroAudio.playValidExitChime();
                          else metroAudio.playDeadEndBuzz();
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md border text-xs transition-colors ${cls}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {pickedOption !== null && (
                  <div
                    className={`flex items-start gap-2 text-xs leading-relaxed pt-2 ${
                      pickedOption === challenge.correctIndex ? 'text-emerald-900' : 'text-rose-900'
                    }`}
                  >
                    {pickedOption === challenge.correctIndex ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span>{challenge.explanation}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
