import React, { useState } from 'react';
import { CheckCircle2, Compass, Loader2, Send, Sparkles, XCircle } from 'lucide-react';
import { metroAudio } from '../utils/metroAudio';

interface GeneratedChallenge {
  title: string;
  regex: string;
  metroStory: string;
  epsilonQuestion: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  validSamples: string[];
  invalidSamples: string[];
}

const SUGGESTED_WHY_QUESTIONS = [
  '¿Por qué en el ejercicio (ab)a* no puedo borrar la estación D y conectar C directo consigo mismo?',
  '¿Por qué en la Imagen 3 la columna EF cambia de ∅ a 1 en las filas C y E?',
  '¿Qué pasaría en el Metro CDMX si agregáramos un pasillo gratis ε desde F hasta A?',
  '¿Por qué el AFD final necesita la estación [∅] si nadie quiere ir ahí?',
];

const EXTRA_REGEX_PRESETS = ['a(ba)*', '(a|b)b*', 'ab*a', '(aa)*b'];

export const GeminiMetroLab: React.FC<{ activeStageLabel: string }> = ({ activeStageLabel }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  const [selectedRegex, setSelectedRegex] = useState('a(ba)*');
  const [challenge, setChallenge] = useState<GeneratedChallenge | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [pickedOption, setPickedOption] = useState<number | null>(null);

  const handleAskWhy = async (qText?: string) => {
    const finalQ = (qText ?? question).trim();
    if (!finalQ) return;
    if (qText) setQuestion(qText);

    setAsking(true);
    setAskError(null);
    metroAudio.playTicketClick();

    try {
      const res = await fetch('/api/ask-why', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: finalQ,
          stageContext: activeStageLabel,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAskError(data.error || 'No se pudo obtener respuesta.');
      } else {
        setAnswer(data.answer);
        metroAudio.playTransferChime();
      }
    } catch {
      setAskError('No se pudo conectar con el servidor del tutor.');
    } finally {
      setAsking(false);
    }
  };

  const handleGenerateChallenge = async (regexInput?: string) => {
    const target = regexInput ?? selectedRegex;
    setGenerating(true);
    setGenError(null);
    setPickedOption(null);
    metroAudio.playTicketClick();

    try {
      const res = await fetch('/api/generate-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regexPattern: target }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.error || 'No se pudo generar el reto.');
      } else {
        setChallenge(data);
        metroAudio.playTransferChime();
      }
    } catch {
      setGenError('No se pudo conectar con el servidor.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="text-xs font-medium text-slate-500">
          Capítulo 5 · Tutor de Raíz y Generador de Nuevas Líneas CDMX
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mt-1 text-balance">
          Explora cualquier «¿Por qué?» a fondo y entrena con nuevas rutas
        </h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-4xl">
          Si te quedó alguna duda sobre la lógica detrás de los pasillos{' '}
          <span className="font-mono font-semibold">ε</span>, las súper-estaciones con corchetes o la Vía Muerta{' '}
          <span className="font-mono font-semibold">[∅]</span>, pregunta en lenguaje normal o genera una nueva línea del
          Metro para practicar.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Root-Cause Tutor */}
        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Pregúntale un «¿Por qué?» al Ingeniero del Metro
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Explicaciones lógicas sin fórmulas pesadas, enfocadas en el ejercicio (ab)a*.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-700">Dudas frecuentes para probar:</div>
            <div className="grid grid-cols-1 gap-2">
              {SUGGESTED_WHY_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleAskWhy(q)}
                  disabled={asking}
                  className="text-left px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-orange-50 hover:border-orange-200 text-xs text-slate-800 transition-colors disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskWhy();
            }}
            className="space-y-2.5 pt-2 border-t border-slate-100"
          >
            <label htmlFor="why-input" className="block text-xs font-medium text-slate-700">
              O escribe tu propia pregunta:
            </label>
            <div className="flex gap-2">
              <input
                id="why-input"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ej. ¿Por qué [C,D,F] y [E,D,F] no se juntan en uno solo?"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="submit"
                disabled={asking || !question.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-40 whitespace-nowrap shrink-0"
              >
                {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{asking ? 'Pensando' : 'Preguntar'}</span>
              </button>
            </div>
          </form>

          {askError && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3.5 text-xs text-rose-900">
              {askError}
            </div>
          )}

          {answer && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
              <div className="text-xs font-semibold text-orange-800">
                Respuesta del Ingeniero de Tránsito
              </div>
              <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                {answer}
              </div>
            </div>
          )}
        </section>

        {/* Right: New Metro Route Challenge Generator */}
        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Generador de Nuevas Rutas del Metro
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Aplica la misma lógica de transbordos a otras expresiones regulares.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-700">Elige una expresión para convertirla en reto:</div>
            <div className="flex flex-wrap gap-2">
              {EXTRA_REGEX_PRESETS.map((rx) => (
                <button
                  key={rx}
                  onClick={() => setSelectedRegex(rx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                    selectedRegex === rx
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {rx}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={selectedRegex}
              onChange={(e) => setSelectedRegex(e.target.value)}
              aria-label="Expresión regular personalizada"
              placeholder="Ej. (ab)*a"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              onClick={() => handleGenerateChallenge()}
              disabled={generating || !selectedRegex.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{generating ? 'Creando ruta' : 'Generar reto'}</span>
            </button>
          </div>

          {genError && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3.5 text-xs text-rose-900">
              {genError}
            </div>
          )}

          {!challenge && !generating && !genError && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center space-y-2">
              <Compass className="w-6 h-6 text-slate-400 mx-auto" />
              <div className="text-sm font-medium text-slate-800">
                Selecciona una expresión y pulsa «Generar reto»
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Crearemos una historia tipo Metro CDMX, ejemplos de boletos aceptados/rechazados y un acertijo de lógica.
              </p>
            </div>
          )}

          {challenge && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
              <div>
                <div className="text-xs font-mono font-semibold text-orange-700">
                  Ruta: {challenge.regex}
                </div>
                <h4 className="text-base font-semibold text-slate-900 mt-0.5">{challenge.title}</h4>
                <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">{challenge.metroStory}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white border border-slate-200 rounded-md p-2.5">
                  <div className="font-semibold text-emerald-800 mb-1">Boletos válidos</div>
                  <div className="font-mono text-slate-800">
                    {challenge.validSamples.join(' · ')}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-md p-2.5">
                  <div className="font-semibold text-rose-800 mb-1">Caen a [∅]</div>
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
