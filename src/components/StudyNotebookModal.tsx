import React, { useEffect, useState } from 'react';
import { BookOpen, Sparkles, Sliders, X } from 'lucide-react';
import {
  DEFAULT_EXERCISE_BUNDLE,
  PRESET_EXERCISES,
  solveAutomatonMethod,
  SolvedMethodBundle,
} from '../engine/automataMethodEngine';
import { metroAudio } from '../utils/metroAudio';
import { GeminiMetroLab } from './GeminiMetroLab';
import { MasteryGuideSection } from './MasteryGuideSection';
import { MethodWorkbench } from './MethodWorkbench';
import { Stage1Roots } from './Stage1Roots';
import { Stage2Closure } from './Stage2Closure';
import { Stage3Subset } from './Stage3Subset';
import { Stage4Simulator } from './Stage4Simulator';
import { ZeroToOneGuide } from './ZeroToOneGuide';

export type NotebookTab = 'lab' | 'zero' | 'master' | 'er' | 'table' | 'subset' | 'sim' | 'tutor';

interface StudyNotebookModalProps {
  initialTab: NotebookTab;
  activeBundle?: SolvedMethodBundle;
  onSelectBundle?: (bundle: SolvedMethodBundle) => void;
  onClose: () => void;
  onUnlockProgress?: (missionKey: 'm1' | 'm2' | 'm3' | 'm4' | 'all') => void;
}

const TABS: {
  id: NotebookTab;
  label: string;
  highlight?: boolean;
  rescue?: boolean;
  builder?: boolean;
}[] = [
  { id: 'lab', label: '0. Constructor ER / AFN-ε', builder: true },
  { id: 'zero', label: '🆘 Desde Cero (Para Humanos)', rescue: true },
  { id: 'master', label: '★ Guía Master 99%', highlight: true },
  { id: 'er', label: '1. ER → Diagrama' },
  { id: 'table', label: '2. Tabla con Flechas' },
  { id: 'subset', label: '3. Súper-Andenes (AFD)' },
  { id: 'sim', label: '4. Pizarra y Quiz' },
  { id: 'tutor', label: '5. Tutor ¿Por qué?' },
];

export const StudyNotebookModal: React.FC<StudyNotebookModalProps> = ({
  initialTab,
  activeBundle = DEFAULT_EXERCISE_BUNDLE,
  onSelectBundle,
  onClose,
  onUnlockProgress,
}) => {
  const [tab, setTab] = useState<NotebookTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const activeLabel = TABS.find((t) => t.id === tab)?.label ?? 'Guía Master';

  const handleTabChange = (nextTab: NotebookTab) => {
    setTab(nextTab);
    metroAudio.playTicketClick();
    if (nextTab === 'er') onUnlockProgress?.('m1');
    else if (nextTab === 'table') onUnlockProgress?.('m2');
    else if (nextTab === 'subset') onUnlockProgress?.('m3');
    else if (nextTab === 'sim') onUnlockProgress?.('m4');
  };

  const handleSelectBundle = (nextBundle: SolvedMethodBundle) => {
    onSelectBundle?.(nextBundle);
  };

  const handleQuickPresetChange = (presetId: string) => {
    const found = PRESET_EXERCISES.find((p) => p.id === presetId);
    if (!found || !onSelectBundle) return;
    const solved =
      found.id === 'a2-ab-astar' ? DEFAULT_EXERCISE_BUNDLE : solveAutomatonMethod(found);
    onSelectBundle(solved);
    metroAudio.playTransferChime();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Cuaderno interactivo de estudio Metro Autómata CDMX"
    >
      <div className="bg-slate-50 border border-slate-200 rounded-2xl shadow-2xl w-full max-w-6xl h-[93vh] flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                Cuaderno de Campo · Método Universal de 4 Láminas (AFN-ε → AFD)
              </h2>
              <p className="text-xs text-slate-500 hidden sm:block truncate">
                Todo el método completo sincronizado con el Metro 3D: cerraduras ε, subconjuntos BFS, pizarra y Hopcroft.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
            <span>Volver al Metro 3D</span>
          </button>
        </header>

        {/* Active Exercise Bar */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>Ejercicio Activo:</span>
            </span>
            <span className="font-bold text-slate-900 truncate max-w-[260px]">
              {activeBundle.spec.title}
            </span>
            <span className="font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
              {activeBundle.spec.regex ? `ER: ${activeBundle.spec.regex}` : 'Grafo AFN-ε manual'}
            </span>
            <span className="font-mono text-slate-600 hidden md:inline">
              Σ={`{${activeBundle.spec.alphabet.join(',')}}`} · {activeBundle.spec.states.length} AFN-ε → {activeBundle.dfaOrder.length} AFD ({activeBundle.minimizedDfa.states.length} mín.)
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onSelectBundle && (
              <select
                value={
                  PRESET_EXERCISES.some((p) => p.id === activeBundle.spec.id)
                    ? activeBundle.spec.id
                    : ''
                }
                onChange={(e) => {
                  if (e.target.value) handleQuickPresetChange(e.target.value);
                }}
                aria-label="Cambiar ejercicio del banco"
                className="text-xs rounded-md border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-800"
              >
                {!PRESET_EXERCISES.some((p) => p.id === activeBundle.spec.id) && (
                  <option value="">Personalizado: {activeBundle.spec.title}</option>
                )}
                {PRESET_EXERCISES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => handleTabChange('lab')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                tab === 'lab'
                  ? 'bg-sky-700 text-white border-sky-700'
                  : 'bg-white text-sky-800 border-sky-300 hover:bg-sky-50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Crear / Exportar</span>
            </button>
          </div>
        </div>

        {/* Notebook Tab Bar */}
        <nav className="bg-white border-b border-slate-200 px-3 sm:px-6 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1 min-w-max py-2">
            {TABS.map((t) => {
              const active = tab === t.id;
              let cls =
                'bg-white text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900';

              if (active) {
                if (t.rescue) cls = 'bg-emerald-600 text-white border-emerald-600';
                else if (t.builder) cls = 'bg-sky-700 text-white border-sky-700';
                else if (t.highlight) cls = 'bg-orange-600 text-white border-orange-600';
                else cls = 'bg-slate-900 text-white border-slate-900';
              } else if (t.rescue) {
                cls = 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100';
              } else if (t.builder) {
                cls = 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100';
              } else if (t.highlight) {
                cls = 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100';
              }

              return (
                <button
                  key={t.id}
                  onClick={() => handleTabChange(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${cls}`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="max-w-5xl mx-auto">
            {tab === 'lab' && (
              <MethodWorkbench
                activeBundle={activeBundle}
                onSelectBundle={handleSelectBundle}
                onJumpToTab={(target) => handleTabChange(target)}
              />
            )}
            {tab === 'zero' && <ZeroToOneGuide onGoToTableTab={() => handleTabChange('table')} />}
            {tab === 'master' && <MasteryGuideSection />}
            {tab === 'er' && (
              <Stage1Roots
                bundle={activeBundle}
                onNextStage={() => handleTabChange('table')}
              />
            )}
            {tab === 'table' && (
              <Stage2Closure
                bundle={activeBundle}
                onNextStage={() => handleTabChange('subset')}
              />
            )}
            {tab === 'subset' && (
              <Stage3Subset
                bundle={activeBundle}
                onNextStage={() => handleTabChange('sim')}
              />
            )}
            {tab === 'sim' && <Stage4Simulator bundle={activeBundle} />}
            {tab === 'tutor' && (
              <GeminiMetroLab
                activeStageLabel={activeLabel}
                bundle={activeBundle}
                onSelectBundle={handleSelectBundle}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
