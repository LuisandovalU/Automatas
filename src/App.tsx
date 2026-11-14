import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { Metro3DCanvas, SceneNetworkMode } from './three/Metro3DCanvas';
import { DFA_STATIONS, DfaStateId, IMAGE2_TABLE, NFA_STATIONS, NfaState, SymbolInput } from './data/automataData';
import { CDMX_LINES, getStationVisualSpec } from './data/cdmxLinesData';
import { REGEX_LIBRARY, RegexPatternId } from './data/regexLibraryData';
import { CdmxStationGlyphSvg } from './components/CdmxStationGlyphSvg';
import { NotebookTab, StudyNotebookModal } from './components/StudyNotebookModal';
import { metroAudio } from './utils/metroAudio';

type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'VICTORY';
type MissionId = 1 | 2 | 3 | 4;
type ExplanationLevel = 'simple' | 'exam';

interface ArrowDemoStep {
  row: NfaState;
  ticket: 'a' | 'b';
  box1: string;
  box2: string;
  box3: string;
  box4: string;
  whySimple: string;
  whyExam: string;
}

const ARROW_FAST_STEPS: ArrowDemoStep[] = [
  {
    row: 'B',
    ticket: 'b',
    box1: 'B',
    box2: '{B}',
    box3: '{C}',
    box4: '{C,D,F}',
    whySimple: 'En B tomas tren "b" a C, y apenas bajas caminas gratis por los puentes ε hacia D y F.',
    whyExam: 'ε-C(B)={B} → δ({B}, b)={C} → ε-C({C})={C,D,F}. Por eso AFN(B, b) = C,D,F.',
  },
  {
    row: 'C',
    ticket: 'a',
    box1: 'C',
    box2: '{C,D,F}',
    box3: '{E}',
    box4: '{E,D,F}',
    whySimple: 'Desde C caminas gratis a {C,D,F}. Solo D tiene tren "a" (lleva a E), y en E caminas gratis a D y F.',
    whyExam: 'ε-C(C)={C,D,F} → δ({C,D,F}, a)=δ(D,a)={E} → ε-C({E})={E,D,F}.',
  },
  {
    row: 'E',
    ticket: 'a',
    box1: 'E',
    box2: '{E,D,F}',
    box3: '{E}',
    box4: '{E,D,F}',
    whySimple: 'Por eso el bucle a* funciona: desde E regresas gratis a D, tomas otra "a" a E, y siempre puedes salir a F.',
    whyExam: 'ε-C(E)={E,D,F} → δ({E,D,F}, a)={E} → ε-C({E})={E,D,F}. Bucle cerrado sobre {E,D,F}.',
  },
];

const MISSION4_CHALLENGES = [
  {
    id: 'c1',
    targetString: 'ab',
    goalText: 'Lleva el tren a salida verde [C,D,F] pagando: a → b',
    expectedValid: true,
  },
  {
    id: 'c2',
    targetString: 'aba',
    goalText: 'Entra al bucle a* en [E,D,F] pagando: a → b → a',
    expectedValid: true,
  },
  {
    id: 'c3',
    targetString: 'abb',
    goalText: 'Descubre por qué "abb" falla pagando: a → b → b (cae a Vía Muerta [∅])',
    expectedValid: false,
  },
];

function computeNfaStep(current: NfaState[], ch: SymbolInput): NfaState[] {
  const moved = new Set<NfaState>();
  for (const st of current) {
    if (st === 'A' && ch === 'a') moved.add('B');
    else if (st === 'B' && ch === 'b') moved.add('C');
    else if (st === 'D' && ch === 'a') moved.add('E');
  }
  const closure = new Set<NfaState>(moved);
  const q = Array.from(moved);
  while (q.length > 0) {
    const curr = q.shift()!;
    if (curr === 'C' || curr === 'E') {
      if (!closure.has('D')) {
        closure.add('D');
        q.push('D');
      }
      if (!closure.has('F')) {
        closure.add('F');
        q.push('F');
      }
    }
  }
  return Array.from(closure);
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [mission, setMission] = useState<MissionId>(1);
  const [expLevel, setExpLevel] = useState<ExplanationLevel>('simple');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [muted, setMuted] = useState(false);
  const [notebookOpen, setNotebookOpen] = useState<NotebookTab | null>(null);

  // Mission 1: AFN-ε interactive driving
  const [nfaStates, setNfaStates] = useState<NfaState[]>(['A']);
  const [nfaTickets, setNfaTickets] = useState<string>('');
  const [m1Done, setM1Done] = useState(false);

  // Mission 2: ER Library in 3D
  const [libPatternId, setLibPatternId] = useState<RegexPatternId>('kleene');
  const [visitedPatterns, setVisitedPatterns] = useState<Set<RegexPatternId>>(() => new Set(['kleene']));
  const [m2Done, setM2Done] = useState(false);

  // Mission 3: Arrow fast-track
  const [arrowIdx, setArrowIdx] = useState(0);
  const [seenArrows, setSeenArrows] = useState<Set<number>>(() => new Set([0]));
  const [m3Done, setM3Done] = useState(false);

  // Mission 4: AFD Dispatch game
  const [dfaState, setDfaState] = useState<DfaStateId>('[A]');
  const [dfaTickets, setDfaTickets] = useState<string>('');
  const [m4ChallengeIdx, setM4ChallengeIdx] = useState(0);
  const [solvedM4Ids, setSolvedM4Ids] = useState<Set<string>>(() => new Set());
  const [m4Done, setM4Done] = useState(false);

  // Live 1-line explanation & station inspector
  const [focusStationId, setFocusStationId] = useState<string | null>(null);
  const [liveHint, setLiveHint] = useState<string>(
    'Paga boleto "a" y luego "b" para ver en 3D por qué Tacubaya (C) te clona en 3 andenes.'
  );

  // Compute Mastery Percentage (0% -> 100%)
  const masteryPercent = useMemo(() => {
    let pct = 0;
    if (m1Done) pct += 25;
    else if (nfaStates.includes('B')) pct += 10;

    if (m2Done) pct += 25;
    else pct += Math.min(20, (visitedPatterns.size - 1) * 10);

    if (m3Done) pct += 25;
    else pct += Math.min(20, (seenArrows.size - 1) * 10);

    if (m4Done) pct += 25;
    else pct += Math.min(20, solvedM4Ids.size * 8);

    return Math.min(100, pct);
  }, [m1Done, m2Done, m3Done, m4Done, nfaStates, visitedPatterns.size, seenArrows.size, solvedM4Ids.size]);

  // Trigger Victory when reaching 100% for the first time
  const [victoryShown, setVictoryShown] = useState(false);
  useEffect(() => {
    if (masteryPercent === 100 && !victoryShown && gameState === 'PLAYING') {
      setVictoryShown(true);
      setGameState('VICTORY');
      metroAudio.playValidExitChime();
    }
  }, [masteryPercent, victoryShown, gameState]);

  // Determine 3D Scene Network Mode
  const sceneMode: SceneNetworkMode =
    mission === 2 ? 'library' : mission === 4 ? 'dfa' : 'nfa';

  // Active NFA highlight states for Mission 1 or Mission 3
  const effectiveNfaStates = useMemo<NfaState[]>(() => {
    if (mission === 3) {
      const step = ARROW_FAST_STEPS[arrowIdx];
      const rowData = IMAGE2_TABLE.find((r) => r.state === step.row)!;
      const list = (step.ticket === 'a' ? rowData.epsilonCA : rowData.epsilonCB)
        .split(',')
        .filter((s): s is NfaState => s in NFA_STATIONS);
      return list.length > 0 ? list : [step.row];
    }
    return nfaStates;
  }, [mission, arrowIdx, nfaStates]);

  const switchMission = useCallback((nextM: MissionId) => {
    setMission(nextM);
    setFocusStationId(null);
    metroAudio.playTicketClick();

    if (nextM === 1) {
      setLiveHint('Misión 1: Paga "a" y "b" para descubrir la clonación en los puentes azules (ε).');
    } else if (nextM === 2) {
      setLiveHint('Misión 2: Toca 3 expresiones (ej. a*, a+, a|b) y mira cómo cambia el puente azul en 3D.');
    } else if (nextM === 3) {
      setLiveHint('Misión 3: Sigue las 3 flechas para ver cómo nacen {C,D,F} y {E,D,F} sin magia.');
    } else {
      setDfaState('[A]');
      setDfaTickets('');
      setLiveHint(`Misión 4: ${MISSION4_CHALLENGES[0].goalText}`);
    }
  }, []);

  const handleNfaTicket = useCallback(
    (ch: SymbolInput) => {
      const next = computeNfaStep(nfaStates, ch);
      setNfaTickets((prev) => (prev + ch).slice(-10));
      setNfaStates(next);

      if (next.length === 0) {
        metroAudio.playDeadEndBuzz();
        setLiveHint(
          expLevel === 'simple'
            ? `Con "${ch}" aquí no hay trenes (∅). Pulsa Reiniciar para volver a Pantitlán (A).`
            : `δ(${nfaStates.join(',')}, ${ch}) = ∅. El autómata se detiene por falta de transición.`
        );
      } else if (next.length > 1) {
        metroAudio.playTransferChime();
        if (!m1Done) {
          setM1Done(true);
        }
        setLiveHint(
          expLevel === 'simple'
            ? `¡Clonado en {${next.join(', ')}}! Por los puentes gratis ε estás en 3 andenes a la vez (+25% Dominio).`
            : `ε-C(δ({${nfaStates.join(',')}}, ${ch})) = {${next.join(', ')}}. No-determinismo activo (+25% Dominio).`
        );
      } else {
        metroAudio.playTicketClick();
        setLiveHint(
          expLevel === 'simple'
            ? `Pagaste "${ch}" y avanzaste al andén ${next[0]} (${NFA_STATIONS[next[0]].metroName}).`
            : `δ(${nfaStates.join(',')}, ${ch}) = {${next[0]}}, ε-C(${next[0]}) = {${next[0]}}.`
        );
      }
    },
    [nfaStates, m1Done, expLevel]
  );

  const handleDfaTicket = useCallback(
    (ch: SymbolInput) => {
      const meta = DFA_STATIONS[dfaState];
      const next = ch === 'a' ? meta.onA : meta.onB;
      const updatedTickets = dfaTickets + ch;
      setDfaState(next);
      setDfaTickets(updatedTickets);

      if (next === '[∅]') {
        metroAudio.playDeadEndBuzz();
        setLiveHint(
          expLevel === 'simple'
            ? `Boleto "${ch}" inválido desde ${dfaState}: el desvío te atrapó en Vía Muerta [∅].`
            : `δ_AFD(${dfaState}, ${ch}) = [∅] (Estado sumidero / pozo, EF = ∅).`
        );
      } else if (DFA_STATIONS[next].ef === '1') {
        metroAudio.playValidExitChime();
        setLiveHint(
          expLevel === 'simple'
            ? `Llegaste a ${next} (Salida válida EF = 1). ¡Viaje aceptado!`
            : `δ_AFD(${dfaState}, ${ch}) = ${next} ∈ F (EF = 1, cadena aceptada).`
        );
      } else {
        metroAudio.playTicketClick();
        setLiveHint(
          expLevel === 'simple'
            ? `Avanzaste con "${ch}" hacia ${next}. Aún no puedes salir (EF = ∅).`
            : `δ_AFD(${dfaState}, ${ch}) = ${next} ∉ F (EF = ∅).`
        );
      }

      // Check active challenge completion
      const challenge = MISSION4_CHALLENGES[m4ChallengeIdx];
      if (challenge && updatedTickets === challenge.targetString) {
        const nextSolved = new Set(solvedM4Ids);
        nextSolved.add(challenge.id);
        setSolvedM4Ids(nextSolved);
        if (nextSolved.size >= MISSION4_CHALLENGES.length) {
          setM4Done(true);
        } else if (m4ChallengeIdx < MISSION4_CHALLENGES.length - 1) {
          window.setTimeout(() => {
            const nextIdx = m4ChallengeIdx + 1;
            setM4ChallengeIdx(nextIdx);
            setDfaState('[A]');
            setDfaTickets('');
            setLiveHint(`¡Reto logrado! Siguiente: ${MISSION4_CHALLENGES[nextIdx].goalText}`);
          }, 1100);
        }
      }
    },
    [dfaState, dfaTickets, m4ChallengeIdx, solvedM4Ids, expLevel]
  );

  const resetTrain = useCallback(() => {
    metroAudio.playTicketClick();
    if (mission === 4) {
      setDfaState('[A]');
      setDfaTickets('');
      setLiveHint(MISSION4_CHALLENGES[m4ChallengeIdx]?.goalText || 'Tren en [A] (Inicio).');
    } else {
      setNfaStates(['A']);
      setNfaTickets('');
      setLiveHint('Tren de vuelta en Pantitlán (A). Paga "a" y luego "b".');
    }
  }, [mission, m4ChallengeIdx]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      if (gameState === 'TITLE_MENU') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setGameState('PLAYING');
          metroAudio.playValidExitChime();
        }
        return;
      }

      if (e.key === 'Escape') {
        if (notebookOpen) {
          setNotebookOpen(null);
        } else if (focusStationId) {
          setFocusStationId(null);
        } else if (gameState === 'PLAYING') {
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
        }
        return;
      }

      if (gameState !== 'PLAYING' || notebookOpen) return;

      const k = e.key.toLowerCase();
      if (k === 'h') {
        setDockCollapsed((c) => !c);
      } else if (k === 'r') {
        resetTrain();
      } else if (k === 'a') {
        if (mission === 1) handleNfaTicket('a');
        else if (mission === 4) handleDfaTicket('a');
      } else if (k === 'b') {
        if (mission === 1) handleNfaTicket('b');
        else if (mission === 4) handleDfaTicket('b');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, notebookOpen, focusStationId, mission, handleNfaTicket, handleDfaTicket, resetTrain]);

  const handleStationClick = useCallback((stId: string) => {
    setFocusStationId(stId);
    metroAudio.playTicketClick();
    if (stId in NFA_STATIONS) {
      const meta = NFA_STATIONS[stId as NfaState];
      setLiveHint(`${meta.id} (${meta.metroName}): ${meta.closureReason}`);
    } else if (stId in DFA_STATIONS) {
      const meta = DFA_STATIONS[stId as DfaStateId];
      setLiveHint(`${meta.id}: ${meta.whyExists}`);
    }
  }, []);

  const selectLibraryPattern = (id: RegexPatternId) => {
    setLibPatternId(id);
    metroAudio.playTransferChime();
    const nextVisited = new Set(visitedPatterns);
    nextVisited.add(id);
    setVisitedPatterns(nextVisited);
    if (nextVisited.size >= 3) {
      setM2Done(true);
    }
    const pat = REGEX_LIBRARY.find((p) => p.id === id)!;
    setLiveHint(`${pat.expression} (${pat.title}): ${pat.differenceHighlight}`);
  };

  const advanceArrowStep = (nextIdx: number) => {
    setArrowIdx(nextIdx);
    const nextSeen = new Set(seenArrows);
    nextSeen.add(nextIdx);
    setSeenArrows(nextSeen);
    if (nextSeen.size >= ARROW_FAST_STEPS.length) {
      setM3Done(true);
    }
    metroAudio.playTransferChime();
    setLiveHint(
      expLevel === 'simple'
        ? ARROW_FAST_STEPS[nextIdx].whySimple
        : ARROW_FAST_STEPS[nextIdx].whyExam
    );
  };

  const handleUnlockProgress = useCallback((key: 'm1' | 'm2' | 'm3' | 'm4' | 'all') => {
    if (key === 'm1' || key === 'all') setM1Done(true);
    if (key === 'm2' || key === 'all') setM2Done(true);
    if (key === 'm3' || key === 'all') setM3Done(true);
    if (key === 'm4' || key === 'all') setM4Done(true);
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    metroAudio.muted = next;
    if (!next) metroAudio.playTicketClick();
  };

  // Interactive Next-Step Coach Suggestion (click to auto-advance if stuck!)
  const coachAction = useMemo<{ text: string; run: () => void }>(() => {
    if (mission === 1) {
      if (nfaStates.length === 0) {
        return { text: 'Paso sugerido: Toca aquí para Reiniciar en Pantitlán (A)', run: resetTrain };
      }
      if (nfaStates.length === 1 && nfaStates[0] === 'A') {
        return { text: 'Paso 1/2: Toca aquí o pulsa Boleto [a] para viajar de A → B', run: () => handleNfaTicket('a') };
      }
      if (nfaStates.length === 1 && nfaStates[0] === 'B') {
        return { text: 'Paso 2/2: Toca aquí o pulsa Boleto [b] para llegar a C y clonarte en {C,D,F}', run: () => handleNfaTicket('b') };
      }
      return { text: '¡Misión 1 lista! Toca aquí para probar otra "a" en el bucle o ir a Misión 2', run: () => switchMission(2) };
    }
    if (mission === 2) {
      const nextUnvisited = REGEX_LIBRARY.find((p) => !visitedPatterns.has(p.id));
      if (nextUnvisited && !m2Done) {
        return {
          text: `Paso sugerido: Explora el patrón "${nextUnvisited.expression}" (${visitedPatterns.size}/3 vistos)`,
          run: () => selectLibraryPattern(nextUnvisited.id),
        };
      }
      return { text: '¡Misión 2 lista! Toca aquí para ir a Misión 3 (Tabla con Flechas)', run: () => switchMission(3) };
    }
    if (mission === 3) {
      if (!m3Done) {
        return {
          text: `Paso sugerido: Ver siguiente ejemplo de flechas (${seenArrows.size}/${ARROW_FAST_STEPS.length})`,
          run: () => advanceArrowStep((arrowIdx + 1) % ARROW_FAST_STEPS.length),
        };
      }
      return { text: '¡Misión 3 lista! Toca aquí para ir a Misión 4 (Juego AFD)', run: () => switchMission(4) };
    }
    // Mission 4
    const ch = MISSION4_CHALLENGES[m4ChallengeIdx];
    if (ch) {
      if (!ch.targetString.startsWith(dfaTickets)) {
        return { text: 'Te desviaste del reto: toca aquí para Reiniciar en [A]', run: resetTrain };
      }
      const nextChar = ch.targetString[dfaTickets.length] as SymbolInput | undefined;
      if (nextChar) {
        return {
          text: `Reto ${m4ChallengeIdx + 1}/3 ("${ch.targetString}"): Toca aquí para enviar boleto "${nextChar}"`,
          run: () => handleDfaTicket(nextChar),
        };
      }
    }
    return { text: '¡Dominio completo! Abre la Guía Master 99% para certificarte', run: () => setNotebookOpen('master') };
  }, [
    mission,
    nfaStates,
    visitedPatterns,
    m2Done,
    m3Done,
    seenArrows.size,
    arrowIdx,
    m4ChallengeIdx,
    dfaTickets,
    resetTrain,
    handleNfaTicket,
    handleDfaTicket,
    switchMission,
  ]);

  const activeArrow = ARROW_FAST_STEPS[arrowIdx];
  const activeLib = REGEX_LIBRARY.find((p) => p.id === libPatternId)!;

  // Resolve inspected station details when focusStationId is active
  const inspectedNfaRow = useMemo(
    () => (focusStationId ? IMAGE2_TABLE.find((r) => r.state === focusStationId) : undefined),
    [focusStationId]
  );
  const inspectedDfaMeta = useMemo(
    () => (focusStationId && focusStationId in DFA_STATIONS ? DFA_STATIONS[focusStationId as DfaStateId] : undefined),
    [focusStationId]
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-slate-100">
      {/* Full-Viewport 3D World */}
      <Metro3DCanvas
        networkMode={sceneMode}
        activeNfaStates={effectiveNfaStates}
        activeDfaState={dfaState}
        libraryPatternId={libPatternId}
        focusStationId={focusStationId}
        isTitleScreen={gameState === 'TITLE_MENU'}
        onStationClick={handleStationClick}
      />

      {/* TITLE SCREEN OVERLAY */}
      {gameState === 'TITLE_MENU' && (
        <div className="fixed inset-0 z-20 flex items-center justify-start p-6 sm:p-12 pointer-events-none">
          <div
            className="max-w-lg rounded-2xl p-7 sm:p-8 border border-slate-700/80 shadow-2xl pointer-events-auto space-y-5"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.92)' }}
          >
            {/* Bespoke Inline SVG Metro CDMX Emblem + Title */}
            <div className="flex items-center gap-3.5">
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                aria-hidden="true"
                className="shrink-0"
              >
                <rect width="48" height="48" rx="12" fill="#EA580C" />
                <rect x="11" y="10" width="26" height="22" rx="5" fill="#FFFFFF" />
                <rect x="15" y="14" width="18" height="9" rx="2" fill="#0F172A" />
                <circle cx="17" cy="27" r="2.2" fill="#EA580C" />
                <circle cx="31" cy="27" r="2.2" fill="#EA580C" />
                <path d="M12 37L17 33H31L36 37" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <div>
                <div className="text-xs font-medium text-orange-300">
                  Simulador 3D · De 0 a Master en Autómatas
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight font-display">
                  Metro Autómata CDMX
                </h1>
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
              Aprende sin memorizar: entiende desde la raíz qué es un pasillo gratis (<span className="font-mono font-semibold text-sky-300">ε</span>),
              cómo pasar de Expresión Regular (<span className="font-mono font-semibold text-amber-300">(ab)a*</span>) a diagrama y tablas con flechas, y domina el <span className="font-mono font-semibold text-emerald-300">AFD</span> al 99%+.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={() => {
                  setGameState('PLAYING');
                  setNotebookOpen('zero');
                  metroAudio.playValidExitChime();
                }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors shadow-lg cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>🆘 No entiendo nada (Explicado desde Cero)</span>
              </button>

              <button
                onClick={() => {
                  setGameState('PLAYING');
                  metroAudio.playValidExitChime();
                }}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-orange-600 text-white hover:bg-orange-500 transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Explorar Mapa 3D</span>
              </button>

              <button
                onClick={() => {
                  setGameState('PLAYING');
                  setNotebookOpen('table');
                  metroAudio.playTicketClick();
                }}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Ir a Tablas</span>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-800 text-xs text-slate-400">
              Teclas A / B: Boleto · Clic en cualquier estación 3D: Ver explicación y líneas · H: Ocultar panel
            </div>
          </div>
        </div>
      )}

      {/* PLAYING HUD */}
      {gameState !== 'TITLE_MENU' && (
        <>
          {/* Top-Left Perimeter HUD */}
          <div className="fixed top-4 left-4 z-10 max-w-xs sm:max-w-sm">
            <div
              className="rounded-xl px-4 py-3 border border-slate-700/80 shadow-lg space-y-2"
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.92)' }}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-orange-300">
                  Misión {mission} de 4
                </span>
                <span className="text-xs font-mono font-bold text-emerald-300 tabular-nums">
                  Dominio: {masteryPercent}%
                </span>
              </div>

              {/* Clean segmented mastery progress bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-transform duration-200 origin-left"
                  style={{ transform: `scaleX(${masteryPercent / 100})` }}
                />
              </div>

              <div className="text-xs text-slate-200 flex items-center justify-between gap-2 tabular-nums">
                <span>
                  {mission === 4 ? 'Andén AFD:' : mission === 2 ? 'Patrón ER:' : 'Andenes activos:'}
                </span>
                <span className="font-mono font-semibold text-white">
                  {mission === 4
                    ? dfaState
                    : mission === 2
                    ? activeLib.expression
                    : effectiveNfaStates.length > 0
                    ? `{${effectiveNfaStates.join(', ')}}`
                    : '∅'}
                </span>
              </div>

              {mission !== 2 && (() => {
                const activeKey =
                  mission === 4
                    ? dfaState
                    : effectiveNfaStates[0] ?? 'A';
                const spec = getStationVisualSpec(activeKey);
                return (
                  <div className="pt-1.5 border-t border-slate-800/90 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <svg width="22" height="22" viewBox="-18 -18 36 36" className="shrink-0 rounded bg-slate-800 p-0.5">
                        <g transform="scale(0.85)">
                          <CdmxStationGlyphSvg glyphId={spec.glyphId} color="#ffffff" />
                        </g>
                      </svg>
                      <span className="text-[11px] font-medium text-slate-200 truncate">
                        {spec.officialName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {spec.lines.map((lineCode) => {
                        const info = CDMX_LINES[lineCode];
                        return (
                          <span
                            key={lineCode}
                            className="w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center border border-white/30"
                            style={{ backgroundColor: info.color, color: info.textColor }}
                            title={info.name}
                          >
                            {info.code}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Toggle Simple vs Formal Exam Language */}
              <div className="pt-1.5 border-t border-slate-800/90 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">Explicación:</span>
                <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
                  <button
                    onClick={() => setExpLevel('simple')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors ${
                      expLevel === 'simple'
                        ? 'bg-orange-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Simple (Metro)
                  </button>
                  <button
                    onClick={() => setExpLevel('exam')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors ${
                      expLevel === 'exam'
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Examen (Fórmulas)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Top-Right Quick Actions */}
          <div className="fixed top-4 right-4 z-10 flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={() => {
                setNotebookOpen('zero');
                metroAudio.playTicketClick();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 border border-amber-300 shadow-md transition-colors whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>🆘 Explicación desde Cero</span>
            </button>

            <button
              onClick={() => {
                setNotebookOpen('master');
                metroAudio.playTicketClick();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/40 shadow-md transition-colors whitespace-nowrap cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Guía Master 99%</span>
            </button>

            <button
              onClick={() => {
                setNotebookOpen(mission === 2 ? 'er' : mission === 3 ? 'table' : mission === 4 ? 'subset' : 'table');
                metroAudio.playTicketClick();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white border border-slate-700 shadow-md hover:bg-slate-800 transition-colors whitespace-nowrap"
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.90)' }}
            >
              <BookOpen className="w-3.5 h-3.5 text-orange-400" />
              <span>Tablas y Flechas</span>
            </button>

            <button
              onClick={() => {
                setNotebookOpen('tutor');
                metroAudio.playTicketClick();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white border border-slate-700 shadow-md hover:bg-slate-800 transition-colors whitespace-nowrap"
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.90)' }}
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>Tutor IA</span>
            </button>

            <button
              onClick={toggleMute}
              aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
              className="p-2 rounded-lg text-white border border-slate-700 shadow-md hover:bg-slate-800 transition-colors"
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.90)' }}
            >
              {muted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-orange-400" />}
            </button>

            <button
              onClick={() => {
                setGameState(gameState === 'PAUSED' ? 'PLAYING' : 'PAUSED');
                metroAudio.playTicketClick();
              }}
              aria-label="Pausa"
              className="p-2 rounded-lg text-white border border-slate-700 shadow-md hover:bg-slate-800 transition-colors"
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.90)' }}
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>

          {/* FLOATING 3D STATION INSPECTOR CARD (When user clicks any 3D station) */}
          {focusStationId && (inspectedNfaRow || inspectedDfaMeta) && (
            <div
              className="fixed top-20 right-4 z-10 w-80 sm:w-96 rounded-2xl border border-slate-700 p-4 shadow-2xl text-white space-y-3"
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)' }}
            >
              {(() => {
                const spec = getStationVisualSpec(focusStationId);
                return (
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <svg
                        width="36"
                        height="36"
                        viewBox="-18 -18 36 36"
                        className="shrink-0 rounded-lg p-1 border border-white/20"
                        style={{ backgroundColor: spec.primaryColor }}
                      >
                        <CdmxStationGlyphSvg glyphId={spec.glyphId} color="#ffffff" />
                      </svg>
                      <div>
                        <div className="text-xs font-mono text-orange-300 font-bold">
                          Estación {focusStationId}
                        </div>
                        <div className="text-sm font-bold text-white leading-tight">
                          {spec.officialName}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {spec.lines.map((lineCode) => {
                            const info = CDMX_LINES[lineCode];
                            return (
                              <span
                                key={lineCode}
                                className="px-1.5 py-0.2 rounded text-[10px] font-bold"
                                style={{ backgroundColor: info.color, color: info.textColor }}
                              >
                                L{info.code}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setFocusStationId(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      aria-label="Cerrar inspector"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })()}

              {inspectedNfaRow && (
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
                    <div className="bg-slate-800/90 rounded-lg p-2 border border-slate-700">
                      <div className="text-[10px] text-sky-300 font-sans">1. ε-Cerradura</div>
                      <div className="font-bold text-white mt-0.5">{`{${inspectedNfaRow.epsilonC}}`}</div>
                    </div>
                    <div className="bg-slate-800/90 rounded-lg p-2 border border-slate-700">
                      <div className="text-[10px] text-orange-300 font-sans">Con boleto "a"</div>
                      <div className="font-bold text-white mt-0.5">{inspectedNfaRow.afnA}</div>
                    </div>
                    <div className="bg-slate-800/90 rounded-lg p-2 border border-slate-700">
                      <div className="text-[10px] text-orange-300 font-sans">Con boleto "b"</div>
                      <div className="font-bold text-white mt-0.5">{inspectedNfaRow.afnB}</div>
                    </div>
                  </div>

                  <p className="text-slate-200 leading-relaxed">
                    <strong className="text-sky-300">¿Por qué?</strong>{' '}
                    {NFA_STATIONS[inspectedNfaRow.state].closureReason}
                  </p>
                  <div className="rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-2 text-[11px] text-emerald-300">
                    <strong>Estado Final (EF):</strong> {inspectedNfaRow.efNew === '1' ? '1 (Salida válida)' : '∅ (No es salida)'} — {inspectedNfaRow.whyEF}
                  </div>
                </div>
              )}

              {inspectedDfaMeta && (
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
                    <div className="bg-slate-800/90 rounded-lg p-2 border border-slate-700">
                      <div className="text-[10px] text-orange-300 font-sans">Con "a" va a</div>
                      <div className="font-bold text-white mt-0.5">{inspectedDfaMeta.onA}</div>
                    </div>
                    <div className="bg-slate-800/90 rounded-lg p-2 border border-slate-700">
                      <div className="text-[10px] text-orange-300 font-sans">Con "b" va a</div>
                      <div className="font-bold text-white mt-0.5">{inspectedDfaMeta.onB}</div>
                    </div>
                    <div className="bg-slate-800/90 rounded-lg p-2 border border-slate-700">
                      <div className="text-[10px] text-emerald-300 font-sans">Salida EF</div>
                      <div className="font-bold text-white mt-0.5">{inspectedDfaMeta.ef}</div>
                    </div>
                  </div>
                  <p className="text-slate-200 leading-relaxed">
                    <strong className="text-orange-300">Origen:</strong> {inspectedDfaMeta.whyExists}
                  </p>
                  <p className="text-slate-300 text-[11px]">{inspectedDfaMeta.hintA}</p>
                </div>
              )}
            </div>
          )}

          {/* COLLAPSIBLE BOTTOM CONTROL DOCK */}
          <div
            className="fixed bottom-4 left-1/2 z-10 transition-transform duration-200"
            style={{
              width: 'min(940px, 96vw)',
              transform: dockCollapsed
                ? 'translate(-50%, calc(100% - 34px))'
                : 'translate(-50%, 0)',
            }}
          >
            {/* Collapse / Expand Tab */}
            <div className="flex justify-center">
              <button
                onClick={() => setDockCollapsed((c) => !c)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-t-lg text-[11px] font-semibold text-slate-200 border border-b-0 border-slate-700 hover:text-white"
                style={{ backgroundColor: 'rgba(15, 23, 42, 0.94)' }}
              >
                {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>{dockCollapsed ? 'Mostrar controles (H)' : 'Ocultar controles (H)'}</span>
              </button>
            </div>

            {/* Dock Body */}
            <div
              className="rounded-xl border border-slate-700 p-3.5 sm:p-4 shadow-2xl space-y-2.5"
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.94)' }}
            >
              {/* Mission Switcher + Interactive Step Coach Pill */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 1 as MissionId, label: '1. Problema ε', done: m1Done },
                    { id: 2 as MissionId, label: '2. Tipos de ER', done: m2Done },
                    { id: 3 as MissionId, label: '3. Tabla Flechas', done: m3Done },
                    { id: 4 as MissionId, label: '4. Juego AFD', done: m4Done },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => switchMission(m.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                        mission === m.id
                          ? 'bg-orange-600 text-white'
                          : m.done
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {m.done && <CheckCircle2 className="w-3 h-3" />}
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>

                {/* Clickable Coach Suggestion */}
                <button
                  onClick={coachAction.run}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/40 hover:bg-amber-500/30 transition-colors text-left"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="truncate max-w-xs sm:max-w-md">{coachAction.text}</span>
                </button>
              </div>

              {/* Live Explanation Banner */}
              <div className="text-xs text-slate-200 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center justify-between gap-2">
                <span className="truncate" title={liveHint}>
                  {liveHint}
                </span>
                <span className="text-[10px] text-slate-400 shrink-0 hidden sm:inline">
                  Clic en cualquier estación 3D para inspeccionar
                </span>
              </div>

              {/* Mission-Specific Ultra-Fast Interactive Controls */}
              {mission === 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleNfaTicket('a')}
                      className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-orange-600 text-white hover:bg-orange-500 transition-colors whitespace-nowrap"
                    >
                      Boleto [a]
                    </button>
                    <button
                      onClick={() => handleNfaTicket('b')}
                      className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-orange-600 text-white hover:bg-orange-500 transition-colors whitespace-nowrap"
                    >
                      Boleto [b]
                    </button>
                    <button
                      onClick={resetTrain}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 whitespace-nowrap"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reiniciar</span>
                    </button>
                    <span className="text-xs font-mono text-slate-400 ml-1">
                      Boletos: <strong className="text-white">{nfaTickets || '—'}</strong>
                    </span>
                  </div>

                  {/* Quick station inspector pills */}
                  <div className="flex items-center gap-1">
                    {(['A', 'B', 'C', 'D', 'E', 'F'] as NfaState[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleStationClick(st)}
                        className={`w-7 h-7 rounded-md text-xs font-mono font-bold border transition-colors ${
                          focusStationId === st
                            ? 'bg-sky-600 text-white border-sky-400'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                        title={`Inspeccionar estación ${st}`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mission === 2 && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {REGEX_LIBRARY.map((pat) => (
                      <button
                        key={pat.id}
                        onClick={() => selectLibraryPattern(pat.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors whitespace-nowrap ${
                          libPatternId === pat.id
                            ? 'bg-sky-600 text-white'
                            : visitedPatterns.has(pat.id)
                            ? 'bg-slate-800 text-emerald-300 border border-emerald-700/50 hover:bg-slate-700'
                            : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                        }`}
                      >
                        {pat.expression}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setNotebookOpen('er')}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 whitespace-nowrap"
                    >
                      Ver comparador 2D y tablas
                    </button>
                    {m2Done && (
                      <button
                        onClick={() => switchMission(3)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 whitespace-nowrap"
                      >
                        <span>Siguiente: Flechas</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {mission === 3 && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
                  {/* Inline compact arrow chain */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                    <span className="px-2.5 py-1 rounded bg-slate-800 text-white font-semibold">
                      1. Estación {activeArrow.box1}
                    </span>
                    <span className="text-sky-300 font-sans text-[11px]">—ε-C→</span>
                    <span className="px-2.5 py-1 rounded bg-sky-900 text-sky-100 font-semibold">
                      {activeArrow.box2}
                    </span>
                    <span className="text-orange-300 font-sans text-[11px]">—tren "{activeArrow.ticket}"→</span>
                    <span className="px-2.5 py-1 rounded bg-slate-800 text-white font-semibold">
                      {activeArrow.box3}
                    </span>
                    <span className="text-sky-300 font-sans text-[11px]">—ε-C→</span>
                    <span className="px-2.5 py-1 rounded bg-orange-600 text-white font-bold">
                      {activeArrow.box4}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => advanceArrowStep((arrowIdx + 1) % ARROW_FAST_STEPS.length)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-orange-600 text-white hover:bg-orange-500 whitespace-nowrap"
                    >
                      Siguiente flecha ({arrowIdx + 1}/{ARROW_FAST_STEPS.length})
                    </button>
                    <button
                      onClick={() => setNotebookOpen('table')}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 whitespace-nowrap"
                    >
                      Practicar tabla paso a paso
                    </button>
                  </div>
                </div>
              )}

              {mission === 4 && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleDfaTicket('a')}
                      className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-orange-600 text-white hover:bg-orange-500 whitespace-nowrap"
                    >
                      Boleto [a]
                    </button>
                    <button
                      onClick={() => handleDfaTicket('b')}
                      className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-orange-600 text-white hover:bg-orange-500 whitespace-nowrap"
                    >
                      Boleto [b]
                    </button>
                    <button
                      onClick={resetTrain}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 whitespace-nowrap"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reiniciar</span>
                    </button>
                    <span className="text-xs font-mono text-slate-300 tabular-nums">
                      Reto {m4ChallengeIdx + 1}/3 · Tira: <strong className="text-white">{dfaTickets || '—'}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setNotebookOpen('subset')}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 whitespace-nowrap"
                    >
                      Tabla Súper-Andenes
                    </button>
                    <button
                      onClick={() => setNotebookOpen('master')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 whitespace-nowrap"
                    >
                      Simulador Examen 99%
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* PAUSE MODAL */}
      {gameState === 'PAUSED' && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.72)' }}
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900">Juego en Pausa</h2>
            <p className="text-sm text-slate-600 tabular-nums">
              Tu progreso actual de dominio es <strong>{masteryPercent}%</strong>.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setGameState('PLAYING')}
                className="w-full py-2.5 rounded-lg text-sm font-semibold bg-orange-600 text-white hover:bg-orange-700"
              >
                Continuar aprendiendo
              </button>
              <button
                onClick={() => {
                  setGameState('PLAYING');
                  setNotebookOpen('master');
                }}
                className="w-full py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Abrir Guía Master 99%
              </button>
              <button
                onClick={() => {
                  setGameState('PLAYING');
                  setNotebookOpen('table');
                }}
                className="w-full py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-800 hover:bg-slate-200"
              >
                Abrir Cuaderno de Tablas
              </button>
              <button
                onClick={() => setGameState('TITLE_MENU')}
                className="w-full py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900"
              >
                Volver a portada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VICTORY MODAL (100% Mastery) */}
      {gameState === 'VICTORY' && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-7 max-w-md w-full space-y-5 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-emerald-700 tabular-nums">
                100% DE DOMINIO COMPLETADO
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                ¡Dominaste la conversión AFN-ε → AFD!
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Ya entiendes por qué existen los pasillos <span className="font-mono font-semibold">ε</span>, cómo
                diferenciar expresiones regulares, cómo llenar la tabla de 3 pasos con flechas y por qué el AFD usa
                súper-estaciones y Vía Muerta <span className="font-mono font-semibold">[∅]</span>.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => {
                  setGameState('PLAYING');
                  setNotebookOpen('master');
                }}
                className="flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Ver Guía Master 99%
              </button>
              <button
                onClick={() => {
                  setGameState('PLAYING');
                  setNotebookOpen('sim');
                }}
                className="flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
              >
                Pizarra y Quiz
              </button>
              <button
                onClick={() => setGameState('PLAYING')}
                className="flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold bg-orange-600 text-white hover:bg-orange-700"
              >
                Seguir en 3D
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDY NOTEBOOK OVERLAY (Master Guide, Step-by-step arrow tables, ER library, Quiz & Gemini Tutor) */}
      {notebookOpen && (
        <StudyNotebookModal
          initialTab={notebookOpen}
          onClose={() => setNotebookOpen(null)}
          onUnlockProgress={handleUnlockProgress}
        />
      )}
    </div>
  );
}
