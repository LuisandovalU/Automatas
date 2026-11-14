import React, { useState } from 'react';
import { Award, X } from 'lucide-react';
import { Stage1Roots } from './Stage1Roots';
import { Stage2Closure } from './Stage2Closure';
import { Stage3Subset } from './Stage3Subset';
import { Stage4Simulator } from './Stage4Simulator';
import { GeminiMetroLab } from './GeminiMetroLab';
import { MasteryGuideSection } from './MasteryGuideSection';
import { ZeroToOneGuide } from './ZeroToOneGuide';
import { metroAudio } from '../utils/metroAudio';

export type NotebookTab = 'zero' | 'master' | 'er' | 'table' | 'subset' | 'sim' | 'tutor';

interface StudyNotebookModalProps {
  initialTab: NotebookTab;
  onClose: () => void;
  onUnlockProgress?: (missionKey: 'm1' | 'm2' | 'm3' | 'm4' | 'all') => void;
}

const TABS: { id: NotebookTab; label: string; highlight?: boolean; rescue?: boolean }[] = [
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
  onClose,
  onUnlockProgress,
}) => {
  const [tab, setTab] = useState<NotebookTab>(initialTab);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.72)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Cuaderno interactivo de autómatas"
    >
      <div className="bg-slate-50 border border-slate-200 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  metroAudio.playTicketClick();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1 ${
                  tab === t.id
                    ? t.rescue
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                      : t.highlight
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-900 text-white'
                    : t.rescue
                    ? 'bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200 font-bold'
                    : t.highlight
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.highlight && <Award className="w-3.5 h-3.5" />}
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-600 text-white hover:bg-orange-700 whitespace-nowrap"
          >
            <X className="w-4 h-4" />
            <span>Volver al Mapa 3D</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {tab === 'zero' && (
            <ZeroToOneGuide
              onGoToTableTab={() => setTab('table')}
              onUnlockAll={() => onUnlockProgress?.('all')}
            />
          )}
          {tab === 'master' && (
            <MasteryGuideSection
              onCompletedMastery={() => onUnlockProgress?.('all')}
            />
          )}
          {tab === 'er' && (
            <Stage1Roots
              onNextStage={() => {
                onUnlockProgress?.('m2');
                setTab('table');
              }}
            />
          )}
          {tab === 'table' && (
            <Stage2Closure
              onNextStage={() => {
                onUnlockProgress?.('m3');
                setTab('subset');
              }}
            />
          )}
          {tab === 'subset' && (
            <Stage3Subset
              onNextStage={() => {
                onUnlockProgress?.('m4');
                setTab('sim');
              }}
            />
          )}
          {tab === 'sim' && <Stage4Simulator />}
          {tab === 'tutor' && (
            <GeminiMetroLab
              activeStageLabel={TABS.find((t) => t.id === tab)?.label || 'Ejercicio A2'}
            />
          )}
        </div>
      </div>
    </div>
  );
};
