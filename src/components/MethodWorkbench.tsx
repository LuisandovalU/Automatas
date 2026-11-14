import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BookMarked,
  CheckCircle2,
  Download,
  FileText,
  Layers,
  Plus,
  Printer,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import {
  buildNfaFromRegex,
  generateStudyGuideMarkdown,
  NfaSpec,
  NfaTransitionSpec,
  PRESET_EXERCISES,
  solveAutomatonMethod,
  SolvedMethodBundle,
} from '../engine/automataMethodEngine';
import { metroAudio } from '../utils/metroAudio';

interface MethodWorkbenchProps {
  activeBundle: SolvedMethodBundle;
  onSelectBundle: (bundle: SolvedMethodBundle) => void;
  onJumpToTab?: (tab: 'er' | 'table' | 'subset' | 'sim') => void;
}

const KEYPAD_BUTTONS = [
  { label: '(', value: '(', title: 'Abrir agrupación' },
  { label: ')', value: ')', title: 'Cerrar agrupación' },
  { label: '|', value: '|', title: 'Unión (o uno o el otro)' },
  { label: '*', value: '*', title: 'Estrella Kleene (0 o más)' },
  { label: '+', value: '+', title: 'Positiva (1 o más)' },
  { label: '?', value: '?', title: 'Opcional (0 o 1)' },
  { label: 'ε', value: 'ε', title: 'Cadena vacía' },
];

export const MethodWorkbench: React.FC<MethodWorkbenchProps> = ({
  activeBundle,
  onSelectBundle,
  onJumpToTab,
}) => {
  const [mode, setMode] = useState<'presets' | 'regex' | 'graph'>('presets');
  const [regexInput, setRegexInput] = useState(activeBundle.spec.regex ?? '(ab)a*');
  const [regexError, setRegexError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Manual AFN-ε Graph Editor state (initialized from activeBundle.spec)
  const [customTitle, setCustomTitle] = useState(activeBundle.spec.title);
  const [customAlphabetStr, setCustomAlphabetStr] = useState(activeBundle.spec.alphabet.join(','));
  const [customStates, setCustomStates] = useState<string[]>(activeBundle.spec.states);
  const [customStart, setCustomStart] = useState<string>(activeBundle.spec.startState);
  const [customAccepts, setCustomAccepts] = useState<string[]>(activeBundle.spec.acceptStates);
  const [customEdges, setCustomEdges] = useState<{ from: string; label: string; to: string }[]>(
    activeBundle.spec.transitions.map((t) => ({ from: t.from, label: t.label, to: t.to }))
  );

  const [newEdgeFrom, setNewEdgeFrom] = useState(activeBundle.spec.states[0] ?? 'A');
  const [newEdgeLabel, setNewEdgeLabel] = useState(activeBundle.spec.alphabet[0] ?? 'a');
  const [newEdgeTo, setNewEdgeTo] = useState(activeBundle.spec.states[1] ?? activeBundle.spec.states[0] ?? 'A');
  const [graphError, setGraphError] = useState<string | null>(null);

  useEffect(() => {
    if (activeBundle.spec.regex) {
      setRegexInput(activeBundle.spec.regex);
    }
    setCustomTitle(activeBundle.spec.title);
    setCustomAlphabetStr(activeBundle.spec.alphabet.join(','));
    setCustomStates(activeBundle.spec.states);
    setCustomStart(activeBundle.spec.startState);
    setCustomAccepts(activeBundle.spec.acceptStates);
    setCustomEdges(activeBundle.spec.transitions.map((t) => ({ from: t.from, label: t.label, to: t.to })));
    setNewEdgeFrom(activeBundle.spec.states[0] ?? 'A');
    setNewEdgeLabel(activeBundle.spec.alphabet[0] ?? 'a');
    setNewEdgeTo(activeBundle.spec.states[1] ?? activeBundle.spec.states[0] ?? 'A');
  }, [activeBundle]);

  const handleLoadPreset = (preset: NfaSpec) => {
    const solved = solveAutomatonMethod(preset);
    onSelectBundle(solved);
    setRegexError(null);
    setStatusMsg(`Cargado "${preset.title}" (${solved.spec.states.length} estados AFN-ε → ${solved.dfaOrder.length} estados AFD).`);
    metroAudio.playTransferChime();
  };

  const handleBuildFromRegex = (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      const spec = buildNfaFromRegex(regexInput, {
        title: `Expresión ${regexInput.replace(/\s+/g, '')}`,
        difficulty: 'Intermedio',
      });
      const solved = solveAutomatonMethod(spec);
      onSelectBundle(solved);
      setRegexError(null);
      setStatusMsg(
        `¡Convertido! ${spec.states.length} estados AFN-ε → ${solved.dfaOrder.length} súper-estados AFD (mínimo: ${solved.minimizedDfa.states.length}).`
      );
      metroAudio.playValidExitChime();
    } catch (err: unknown) {
      setRegexError(err instanceof Error ? err.message : 'Error al interpretar la expresión regular.');
      metroAudio.playDeadEndBuzz();
    }
  };

  const handleAddState = () => {
    if (customStates.length >= 16) {
      setGraphError('Máximo 16 estados en el editor manual.');
      return;
    }
    let idx = customStates.length;
    let candidate = String.fromCharCode(65 + idx);
    while (customStates.includes(candidate)) {
      idx++;
      candidate = idx < 26 ? String.fromCharCode(65 + idx) : `q${idx}`;
    }
    setCustomStates([...customStates, candidate]);
    setGraphError(null);
    metroAudio.playTicketClick();
  };

  const handleRemoveState = (st: string) => {
    if (customStates.length <= 2) {
      setGraphError('Necesitas al menos 2 estados.');
      return;
    }
    const nextStates = customStates.filter((s) => s !== st);
    setCustomStates(nextStates);
    setCustomEdges(customEdges.filter((e) => e.from !== st && e.to !== st));
    setCustomAccepts(customAccepts.filter((a) => a !== st));
    if (customStart === st) setCustomStart(nextStates[0]);
    if (newEdgeFrom === st) setNewEdgeFrom(nextStates[0]);
    if (newEdgeTo === st) setNewEdgeTo(nextStates[0]);
    metroAudio.playTicketClick();
  };

  const handleToggleAccept = (st: string) => {
    setCustomAccepts((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]
    );
    metroAudio.playTicketClick();
  };

  const handleAddEdge = () => {
    const cleanLabel = newEdgeLabel.trim() === 'e' ? 'ε' : newEdgeLabel.trim();
    if (!cleanLabel) return;
    if (customEdges.some((e) => e.from === newEdgeFrom && e.label === cleanLabel && e.to === newEdgeTo)) {
      setGraphError(`Ya existe la transición ${newEdgeFrom} —${cleanLabel}→ ${newEdgeTo}.`);
      return;
    }
    setCustomEdges([...customEdges, { from: newEdgeFrom, label: cleanLabel, to: newEdgeTo }]);
    setGraphError(null);
    metroAudio.playTicketClick();
  };

  const handleApplyCustomGraph = () => {
    const alpha = Array.from(
      new Set(
        customAlphabetStr
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length === 1 && s !== 'ε')
      )
    );
    if (alpha.length === 0) {
      setGraphError('Define al menos 1 símbolo válido en el alfabeto (ej. a,b).');
      return;
    }
    if (customAccepts.length === 0) {
      setGraphError('Marca al menos 1 estado final original (EF).');
      return;
    }
    for (const edge of customEdges) {
      if (edge.label !== 'ε' && !alpha.includes(edge.label)) {
        alpha.push(edge.label);
      }
    }

    const transitions: NfaTransitionSpec[] = customEdges.map((e) => {
      const isWalk = e.label === 'ε';
      return {
        id: `${e.from}-${isWalk ? 'e' : e.label}-${e.to}`,
        from: e.from,
        to: e.to,
        label: e.label,
        kind: isWalk ? 'walk' : 'train',
        explanation: isWalk
          ? `Pasillo gratis (ε): caminas de ${e.from} a ${e.to}.`
          : `Tren "${e.label}": avanza de ${e.from} a ${e.to}.`,
      };
    });

    const spec: NfaSpec = {
      id: `custom-${Date.now()}`,
      title: customTitle.trim() || 'AFN-ε Personalizado',
      sourceKind: 'custom-graph',
      difficulty: 'Examen',
      description: `Autómata AFN-ε personalizado con ${customStates.length} estados sobre Σ = {${alpha.join(', ')}}.`,
      alphabet: alpha,
      states: customStates,
      startState: customStart,
      acceptStates: customAccepts,
      transitions,
    };

    const solved = solveAutomatonMethod(spec);
    onSelectBundle(solved);
    setGraphError(null);
    setStatusMsg(
      `¡AFN-ε personalizado aplicado! Se generaron sus 4 pasos completos (${solved.dfaOrder.length} súper-estados AFD).`
    );
    metroAudio.playValidExitChime();
  };

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    metroAudio.playValidExitChime();
  };

  const handleExportMarkdown = () => {
    const md = generateStudyGuideMarkdown(activeBundle);
    const safeName = (activeBundle.spec.regex || activeBundle.spec.title)
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '');
    downloadFile(`guia-metodo-${safeName || 'automata'}.md`, md, 'text/markdown;charset=utf-8');
  };

  const handleExportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      spec: activeBundle.spec,
      stage2Rows: activeBundle.stage2Rows,
      dfaOrder: activeBundle.dfaOrder,
      dfaRows: activeBundle.dfaRows,
      minimizedDfa: activeBundle.minimizedDfa,
      testCases: activeBundle.testCases,
    };
    downloadFile('automata-metodo-completo.json', JSON.stringify(payload, null, 2), 'application/json');
  };

  const parsedCustomAlpha = customAlphabetStr
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length === 1 && s !== 'ε');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
            Motor Universal del Método (4 Láminas)
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Resuelve CUALQUIER Expresión Regular o AFN-ε paso a paso
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Elige un ejercicio del banco, escribe cualquier expresión regular o dibuja tu propio AFN-ε de clase. Toda la app
            (Mapa 3D, Tabla de 3 Pasos <span className="font-mono font-semibold">ε-C → δ → ε-C</span>, Súper-Andenes{' '}
            <span className="font-mono font-semibold">[S]</span>, Grafo AFD y Minimización) se calcula al instante.
          </p>
        </div>

        {/* Export actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleExportMarkdown}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Exportar Guía (.md)</span>
          </button>
          <button
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setMode('presets');
            metroAudio.playTicketClick();
          }}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
            mode === 'presets'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          <span>Banco de Ejercicios ({PRESET_EXERCISES.length})</span>
        </button>

        <button
          onClick={() => {
            setMode('regex');
            metroAudio.playTicketClick();
          }}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
            mode === 'regex'
              ? 'bg-orange-600 text-white border-orange-600'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Wand2 className="w-4 h-4" />
          <span>Escribir Cualquier Expresión Regular</span>
        </button>

        <button
          onClick={() => {
            setMode('graph');
            metroAudio.playTicketClick();
          }}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
            mode === 'graph'
              ? 'bg-sky-600 text-white border-sky-600'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Editor Manual de AFN-ε</span>
        </button>
      </div>

      {statusMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMsg}</span>
          </div>
          {onJumpToTab && (
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onJumpToTab('table')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800"
              >
                Ir a Tabla 3 Pasos
              </button>
              <button
                onClick={() => onJumpToTab('subset')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100"
              >
                Ir a Súper-Andenes
              </button>
              <button
                onClick={() => onJumpToTab('sim')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100"
              >
                Ir a Grafo AFD
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODE 1: PRESETS */}
      {mode === 'presets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRESET_EXERCISES.map((preset) => {
            const isActive = activeBundle.spec.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleLoadPreset(preset)}
                className={`text-left rounded-xl p-4 border transition-all space-y-2 ${
                  isActive
                    ? 'bg-orange-50/70 border-orange-500 ring-2 ring-orange-200'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold px-2.5 py-0.5 rounded bg-slate-900 text-white">
                    {preset.regex}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      preset.difficulty === 'Base de Clase'
                        ? 'bg-amber-100 text-amber-900'
                        : preset.difficulty === 'Examen'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {preset.difficulty}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900">{preset.title}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{preset.description}</p>
                <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>Σ = {`{${preset.alphabet.join(', ')}}`}</span>
                  <span>{preset.states.length} estados</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* MODE 2: ANY REGEX */}
      {mode === 'regex' && (
        <form
          onSubmit={handleBuildFromRegex}
          className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5"
        >
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Compilador Thompson Compacto → Método de 4 Láminas
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Operadores soportados: concatenación (<span className="font-mono font-semibold">ab</span>), unión (
              <span className="font-mono font-semibold">a|b</span>), estrella 0+ (<span className="font-mono font-semibold">*</span>),
              positiva 1+ (<span className="font-mono font-semibold">+</span>), opcional (<span className="font-mono font-semibold">?</span>),
              paréntesis <span className="font-mono font-semibold">()</span> y vacío <span className="font-mono font-semibold">ε</span>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={regexInput}
              onChange={(e) => setRegexInput(e.target.value)}
              placeholder="Ej. (a|b)*abb o (ab)a* o 0(0|1)*1"
              aria-label="Expresión regular"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-orange-600 text-white hover:bg-orange-700 whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Resolver los 4 Pasos</span>
            </button>
          </div>

          {/* Operator keypad */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 mr-1">Insertar operador:</span>
            {KEYPAD_BUTTONS.map((btn) => (
              <button
                key={btn.label}
                type="button"
                title={btn.title}
                onClick={() => {
                  setRegexInput((prev) => prev + btn.value);
                  metroAudio.playTicketClick();
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 font-mono text-xs font-bold text-slate-800"
              >
                {btn.label}
              </button>
            ))}
            <span className="text-xs text-slate-400 mx-1">|</span>
            {['(ab)a*', '(a|b)*abb', 'a(ba)*', '(ab|ba)*', '0(0|1)*1'].map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setRegexInput(ex)}
                className="px-2.5 py-1 rounded-md bg-orange-50 text-orange-800 border border-orange-200 font-mono text-[11px] font-semibold hover:bg-orange-100"
              >
                {ex}
              </button>
            ))}
          </div>

          {regexError && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3.5 flex items-center gap-2 text-xs text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{regexError}</span>
            </div>
          )}
        </form>
      )}

      {/* MODE 3: MANUAL AFN-ε GRAPH EDITOR */}
      {mode === 'graph' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Editor Directo de AFN-ε (Para cualquier ejercicio del pizarrón)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Define estados, transiciones y cuáles son finales originales (EF). El sistema calculará las tablas y el AFD.
              </p>
            </div>
            <button
              onClick={handleApplyCustomGraph}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              <span>Aplicar y Calcular 4 Láminas</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del ejercicio</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alfabeto Σ (separado por comas)
              </label>
              <input
                type="text"
                value={customAlphabetStr}
                onChange={(e) => setCustomAlphabetStr(e.target.value)}
                placeholder="a,b"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm"
              />
            </div>
          </div>

          {/* States management */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Estados ({customStates.length}) — Haz clic para marcar Inicio o EF original:
              </span>
              <button
                onClick={handleAddState}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Estado</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {customStates.map((st) => {
                const isStart = customStart === st;
                const isAccept = customAccepts.includes(st);
                return (
                  <div
                    key={st}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                  >
                    <span className="font-mono font-bold text-slate-900">{st}</span>
                    <button
                      onClick={() => setCustomStart(st)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        isStart ? 'bg-orange-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      Inicio
                    </button>
                    <button
                      onClick={() => handleToggleAccept(st)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        isAccept ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      EF
                    </button>
                    <button
                      onClick={() => handleRemoveState(st)}
                      aria-label={`Eliminar ${st}`}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add transition */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
            <div className="text-xs font-semibold text-slate-800">Agregar transición (flecha):</div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={newEdgeFrom}
                onChange={(e) => setNewEdgeFrom(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs bg-white"
              >
                {customStates.map((s) => (
                  <option key={s} value={s}>
                    Desde {s}
                  </option>
                ))}
              </select>
              <select
                value={newEdgeLabel}
                onChange={(e) => setNewEdgeLabel(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs bg-white"
              >
                {[...parsedCustomAlpha, 'ε'].map((sym) => (
                  <option key={sym} value={sym}>
                    con {sym}
                  </option>
                ))}
              </select>
              <select
                value={newEdgeTo}
                onChange={(e) => setNewEdgeTo(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs bg-white"
              >
                {customStates.map((s) => (
                  <option key={s} value={s}>
                    hacia {s}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddEdge}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir flecha</span>
              </button>
            </div>

            {/* Transition list */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {customEdges.map((edge, i) => (
                <span
                  key={`${edge.from}-${edge.label}-${edge.to}-${i}`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono ${
                    edge.label === 'ε'
                      ? 'bg-sky-50 border-sky-200 text-sky-900'
                      : 'bg-orange-50 border-orange-200 text-orange-900'
                  }`}
                >
                  <span>
                    {edge.from} —{edge.label}→ {edge.to}
                  </span>
                  <button
                    onClick={() => setCustomEdges(customEdges.filter((_, idx) => idx !== i))}
                    className="hover:text-rose-600"
                    aria-label="Quitar transición"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {graphError && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-center gap-2 text-xs text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{graphError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
