import React from 'react';
import { DFA_ORDER, DFA_STATIONS } from '../data/automataData';
import { SolvedMethodBundle } from '../engine/automataMethodEngine';
import { getStationVisualSpec, CDMX_LINES } from '../data/cdmxLinesData';
import { CdmxStationGlyphSvg } from './CdmxStationGlyphSvg';

interface MetroMapDFAProps {
  bundle?: SolvedMethodBundle;
  activeState?: string | null;
  activeDfaState?: string | null;
  highlightedEdge?: string | null;
  lastTransitionSymbol?: string | null;
  lastFromState?: string | null;
  onSelectDfaState?: (stateId: string) => void;
  caption?: string;
}

const DEFAULT_DFA_POSITIONS: Record<string, { x: number; y: number }> = {
  '[A]': { x: 130, y: 205 },
  '[B]': { x: 375, y: 120 },
  '[C,D,F]': { x: 645, y: 120 },
  '[E,D,F]': { x: 890, y: 205 },
  '[∅]': { x: 470, y: 390 },
};

/**
 * Helper to find exact intersection point on a rectangular station plaque boundary
 * from center (cx, cy) toward target (tx, ty) with given half-width/half-height padding.
 */
function getBoxBoundaryPoint(
  cx: number,
  cy: number,
  tx: number,
  ty: number,
  halfW: number,
  halfH: number
): { x: number; y: number } {
  const dx = tx - cx;
  const dy = ty - cy;
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
    return { x: cx, y: cy - halfH };
  }
  const scaleX = Math.abs(dx) > 0.001 ? halfW / Math.abs(dx) : Infinity;
  const scaleY = Math.abs(dy) > 0.001 ? halfH / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);
  return {
    x: cx + dx * scale,
    y: cy + dy * scale,
  };
}

interface DfaStationPlaqueProps {
  id: string;
  metroStation: string;
  x: number;
  y: number;
  isAccept: boolean;
  isDead: boolean;
  isActive: boolean;
  onSelect?: (id: string) => void;
}

const DfaStationPlaque: React.FC<DfaStationPlaqueProps> = ({
  id,
  metroStation,
  x,
  y,
  isAccept,
  isDead,
  isActive,
  onSelect,
}) => {
  const spec = getStationVisualSpec(id);
  const w = 132;
  const h = 72;
  const halfW = w / 2;
  const halfH = h / 2;
  const clipId = `dfa-plaque-clip-${id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const bandHeight = h / Math.max(1, spec.lines.length);

  const rawTitle = spec.officialName || metroStation;
  const shortTitle =
    rawTitle.length > 22 ? `${rawTitle.slice(0, 21)}…` : rawTitle;

  return (
    <g
      onClick={() => onSelect?.(id)}
      style={{ cursor: 'pointer' }}
      role="button"
      aria-label={`Subconjunto AFD ${id} (${rawTitle})`}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={x - halfW} y={y - halfH} width={w} height={h} rx="15" />
        </clipPath>
      </defs>

      {/* Active train halo */}
      {isActive && (
        <rect
          x={x - halfW - 8}
          y={y - halfH - 8}
          width={w + 16}
          height={h + 16}
          rx="20"
          fill="none"
          stroke={isDead ? '#e11d48' : '#FF6B00'}
          strokeWidth="3.2"
          opacity="0.45"
        />
      )}

      {/* Double border ring for accepting states (EF = 1) */}
      {isAccept && (
        <rect
          x={x - halfW - 5}
          y={y - halfH - 5}
          width={w + 10}
          height={h + 10}
          rx="18"
          fill="none"
          stroke="#10b981"
          strokeWidth="2.8"
          strokeDasharray="6,3"
        />
      )}

      {/* Clipped Official STC Correspondence Card */}
      <g clipPath={`url(#${clipId})`} filter="url(#dfaNodeShadow)">
        <rect
          x={x - halfW}
          y={y - halfH}
          width={w}
          height={h}
          rx="15"
          fill={isDead ? '#fff1f2' : '#ffffff'}
        />

        {/* Top header accent bar */}
        <rect
          x={x - halfW}
          y={y - halfH}
          width={w}
          height="7"
          fill={isDead ? '#e11d48' : isAccept ? '#10b981' : spec.primaryColor}
        />

        {/* Left Official Pictogram Emblem Box with Multi-Line Color Bands */}
        <rect
          x={x - halfW}
          y={y - halfH}
          width="48"
          height={h}
          fill={spec.primaryColor}
        />
        {spec.lines.map((lineId, idx) => {
          const lineColor = CDMX_LINES[lineId]?.color || spec.primaryColor;
          return (
            <rect
              key={`${id}-band-${lineId}-${idx}`}
              x={x - halfW}
              y={y - halfH + idx * bandHeight}
              width="7"
              height={bandHeight + 0.5}
              fill={lineColor}
            />
          );
        })}

        {/* Official STC Pictogram (Composite Trio/Duo for Subsets!) */}
        <g transform={`translate(${x - halfW + 27}, ${y + 2}) scale(1.06)`}>
          <CdmxStationGlyphSvg
            glyphId={spec.glyphId}
            memberGlyphs={spec.memberGlyphs}
            color="#ffffff"
          />
        </g>

        {/* Subtle divider between emblem and info area */}
        <line
          x1={x - halfW + 48}
          y1={y - halfH}
          x2={x - halfW + 48}
          y2={y + halfH}
          stroke="#cbd5e1"
          strokeWidth="1.2"
        />
      </g>

      {/* Outer crisp border */}
      <rect
        x={x - halfW}
        y={y - halfH}
        width={w}
        height={h}
        rx="15"
        fill="none"
        stroke={
          isActive
            ? '#FF6B00'
            : isAccept
            ? '#059669'
            : isDead
            ? '#e11d48'
            : '#0f172a'
        }
        strokeWidth={isActive ? 3.2 : 2.3}
      />

      {/* Subset State ID on right side */}
      <text
        x={x - halfW + 55}
        y={y - 9}
        textAnchor="start"
        fill={isDead ? '#be123c' : '#0f172a'}
        fontSize={id.length > 8 ? '11' : '12.5'}
        fontWeight="900"
        fontFamily="monospace"
      >
        {id}
      </text>

      {/* Official correspondence station names */}
      <text
        x={x - halfW + 55}
        y={y + 6}
        textAnchor="start"
        fill={isAccept ? '#047857' : isDead ? '#e11d48' : '#475569'}
        fontSize="7.4"
        fontWeight="800"
      >
        {shortTitle}
      </text>

      {/* Official Line number mini squares */}
      <g transform={`translate(${x - halfW + 55}, ${y + 13})`}>
        {spec.lines.slice(0, 5).map((lineId, idx) => {
          const lineSpec = CDMX_LINES[lineId];
          if (!lineSpec) return null;
          return (
            <g key={`${id}-line-badge-${lineId}`} transform={`translate(${idx * 13}, 0)`}>
              <rect
                x="0"
                y="0"
                width="11"
                height="11"
                rx="2.5"
                fill={lineSpec.color}
              />
              <text
                x="5.5"
                y="8"
                textAnchor="middle"
                fill={lineSpec.textColor}
                fontSize="6.8"
                fontWeight="900"
              >
                {lineId}
              </text>
            </g>
          );
        })}
      </g>

      {/* Top-Right Status Pill (SALIDA EF=1 or POZO ∅) */}
      {isAccept && (
        <g transform={`translate(${x + halfW - 30}, ${y - halfH - 2})`}>
          <rect
            x="-26"
            y="-8"
            width="52"
            height="15"
            rx="5"
            fill="#059669"
            stroke="#ffffff"
            strokeWidth="1.2"
          />
          <text
            x="0"
            y="2.5"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="7.2"
            fontWeight="900"
          >
            SALIDA EF=1
          </text>
        </g>
      )}

      {isDead && (
        <g transform={`translate(${x + halfW - 30}, ${y - halfH - 2})`}>
          <rect
            x="-26"
            y="-8"
            width="52"
            height="15"
            rx="5"
            fill="#e11d48"
            stroke="#ffffff"
            strokeWidth="1.2"
          />
          <text
            x="0"
            y="2.5"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="7.2"
            fontWeight="900"
          >
            POZO ∅
          </text>
        </g>
      )}

      {/* Active Train Badge */}
      {isActive && (
        <g transform={`translate(${x - 20}, ${y - halfH - 13})`}>
          <rect
            x="-25"
            y="-9"
            width="50"
            height="16"
            rx="8"
            fill="#FF6B00"
            stroke="#ffffff"
            strokeWidth="1.2"
          />
          <text
            x="0"
            y="2.5"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="8"
            fontWeight="900"
          >
            🚇 AQUÍ
          </text>
        </g>
      )}
    </g>
  );
};

export const MetroMapDFA: React.FC<MetroMapDFAProps> = ({
  bundle,
  activeState,
  activeDfaState,
  highlightedEdge,
  lastTransitionSymbol,
  lastFromState,
  onSelectDfaState,
  caption,
}) => {
  const currentDfaState = activeState ?? activeDfaState ?? '[A]';
  const isCustomBundle = bundle && bundle.spec.id !== 'a2-ab-astar';

  const isEdgeActive = (edgeId: string, from: string, symbols: string[]) => {
    if (highlightedEdge && highlightedEdge === edgeId) return true;
    return (
      lastFromState === from &&
      !!lastTransitionSymbol &&
      symbols.includes(lastTransitionSymbol)
    );
  };

  // ============================================================================
  // CASE 1: Masterpiece Hand-Tuned Layout for (ab)a* (Exact 5 Subsets: [A], [B], [C,D,F], [E,D,F], [∅])
  // ============================================================================
  if (!isCustomBundle) {
    return (
      <div className="w-full space-y-2">
        <div className="w-full overflow-x-auto">
          <svg
            viewBox="0 0 1000 470"
            className="w-full h-auto select-none"
            role="img"
            aria-label="Diagrama de Estados AFD por Construcción de Subconjuntos para (ab)a*"
          >
            <defs>
              <pattern id="dfaGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path
                  d="M 24 0 L 0 0 0 24"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="0.8"
                />
              </pattern>

              <marker
                id="dfaArrowPink"
                viewBox="0 0 10 10"
                refX="8.5"
                refY="5"
                markerWidth="6.5"
                markerHeight="6.5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#F04E98" />
              </marker>
              <marker
                id="dfaArrowBlue"
                viewBox="0 0 10 10"
                refX="8.5"
                refY="5"
                markerWidth="6.5"
                markerHeight="6.5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#005EB8" />
              </marker>
              <marker
                id="dfaArrowSlate"
                viewBox="0 0 10 10"
                refX="8.5"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
              </marker>
              <marker
                id="dfaArrowStart"
                viewBox="0 0 10 10"
                refX="8.5"
                refY="5"
                markerWidth="6.5"
                markerHeight="6.5"
                orient="auto"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#0f172a" />
              </marker>

              <filter id="dfaNodeShadow" x="-20%" y="-20%" width="140%" height="145%">
                <feDropShadow dx="0" dy="4" stdDeviation="4.5" floodColor="#0f172a" floodOpacity="0.16" />
              </filter>
              <filter id="dfaPillShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.15" />
              </filter>
            </defs>

            <rect
              x="8"
              y="8"
              width="984"
              height="454"
              rx="20"
              fill="url(#dfaGrid)"
              stroke="#cbd5e1"
              strokeWidth="1.2"
            />

            {/* Top Title Banner inside SVG */}
            <g transform="translate(24, 22)">
              <rect x="0" y="0" width="425" height="30" rx="9" fill="#0f172a" />
              <circle cx="15" cy="15" r="5" fill="#10b981" />
              <text
                x="28"
                y="19"
                fill="#ffffff"
                fontSize="11"
                fontWeight="900"
                letterSpacing="0.06em"
              >
                CORRESPONDENCIAS AFD DETERMINISTA · ER = (ab)a*
              </text>
            </g>

            {/* Initial Entry Arrow -> [A] */}
            <g>
              <line
                x1="18"
                y1="205"
                x2="58"
                y2="205"
                stroke="#0f172a"
                strokeWidth="3.5"
                markerEnd="url(#dfaArrowStart)"
              />
              <rect x="14" y="180" width="42" height="16" rx="4" fill="#0f172a" />
              <text
                x="35"
                y="191"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="8.5"
                fontWeight="900"
              >
                INICIO
              </text>
            </g>

            {/* 1. [A] --a--> [B] */}
            <g>
              <path
                d="M 192 178 Q 248 122 303 120"
                fill="none"
                stroke="#ffffff"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M 192 178 Q 248 122 303 120"
                fill="none"
                stroke="#F04E98"
                strokeWidth={isEdgeActive('[A]-a-[B]', '[A]', ['a']) ? 5 : 3.6}
                markerEnd="url(#dfaArrowPink)"
              />
              <g transform="translate(248, 132)" filter="url(#dfaPillShadow)">
                <rect
                  x="-30"
                  y="-11"
                  width="60"
                  height="22"
                  rx="7"
                  fill="#F04E98"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10.5"
                  fontWeight="900"
                >
                  a (L1)
                </text>
              </g>
            </g>

            {/* 2. [B] --b--> [C,D,F] */}
            <g>
              <line
                x1="441"
                y1="120"
                x2="573"
                y2="120"
                stroke="#ffffff"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <line
                x1="441"
                y1="120"
                x2="573"
                y2="120"
                stroke="#005EB8"
                strokeWidth={isEdgeActive('[B]-b-[C,D,F]', '[B]', ['b']) ? 5 : 3.6}
                markerEnd="url(#dfaArrowBlue)"
              />
              <g transform="translate(507, 98)" filter="url(#dfaPillShadow)">
                <rect
                  x="-30"
                  y="-11"
                  width="60"
                  height="22"
                  rx="7"
                  fill="#005EB8"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10.5"
                  fontWeight="900"
                >
                  b (L2)
                </text>
              </g>
            </g>

            {/* 3. [C,D,F] --a--> [E,D,F] */}
            <g>
              <path
                d="M 711 124 Q 775 130 822 174"
                fill="none"
                stroke="#ffffff"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M 711 124 Q 775 130 822 174"
                fill="none"
                stroke="#F04E98"
                strokeWidth={isEdgeActive('[C,D,F]-a-[E,D,F]', '[C,D,F]', ['a']) ? 5 : 3.6}
                markerEnd="url(#dfaArrowPink)"
              />
              <g transform="translate(772, 132)" filter="url(#dfaPillShadow)">
                <rect
                  x="-30"
                  y="-11"
                  width="60"
                  height="22"
                  rx="7"
                  fill="#F04E98"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10.5"
                  fontWeight="900"
                >
                  a (L1)
                </text>
              </g>
            </g>

            {/* 4. [E,D,F] --a--> [E,D,F] (Self-loop Kleene a*) */}
            <g>
              <path
                d="M 862 165 C 838 72, 942 72, 918 165"
                fill="none"
                stroke="#ffffff"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M 862 165 C 838 72, 942 72, 918 165"
                fill="none"
                stroke="#F04E98"
                strokeWidth={isEdgeActive('[E,D,F]-a-[E,D,F]', '[E,D,F]', ['a']) ? 5 : 3.6}
                markerEnd="url(#dfaArrowPink)"
              />
              <g transform="translate(890, 78)" filter="url(#dfaPillShadow)">
                <rect
                  x="-48"
                  y="-11"
                  width="96"
                  height="22"
                  rx="7"
                  fill="#F04E98"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="900"
                >
                  a · Bucle a*
                </text>
              </g>
            </g>

            {/* ================= TRANSITIONS TO DEAD STATE [∅] ================= */}
            {/* [A] --b--> [∅] */}
            <g>
              <path
                d="M 155 241 Q 225 365 398 388"
                fill="none"
                stroke="#ffffff"
                strokeWidth="6"
                opacity="0.85"
              />
              <path
                d="M 155 241 Q 225 365 398 388"
                fill="none"
                stroke={isEdgeActive('[A]-b-[∅]', '[A]', ['b']) ? '#e11d48' : '#94a3b8'}
                strokeWidth={isEdgeActive('[A]-b-[∅]', '[A]', ['b']) ? 3.8 : 2.3}
                strokeDasharray="6,4"
                markerEnd="url(#dfaArrowSlate)"
              />
              <g transform="translate(245, 336)" filter="url(#dfaPillShadow)">
                <rect
                  x="-26"
                  y="-10"
                  width="52"
                  height="20"
                  rx="6"
                  fill="#ffffff"
                  stroke="#64748b"
                  strokeWidth="1.4"
                />
                <text
                  x="0"
                  y="3.5"
                  textAnchor="middle"
                  fill="#334155"
                  fontSize="9.5"
                  fontWeight="900"
                >
                  b → ∅
                </text>
              </g>
            </g>

            {/* [B] --a--> [∅] */}
            <g>
              <path
                d="M 380 156 Q 395 270 438 350"
                fill="none"
                stroke="#ffffff"
                strokeWidth="6"
                opacity="0.85"
              />
              <path
                d="M 380 156 Q 395 270 438 350"
                fill="none"
                stroke={isEdgeActive('[B]-a-[∅]', '[B]', ['a']) ? '#e11d48' : '#94a3b8'}
                strokeWidth={isEdgeActive('[B]-a-[∅]', '[B]', ['a']) ? 3.8 : 2.3}
                strokeDasharray="6,4"
                markerEnd="url(#dfaArrowSlate)"
              />
              <g transform="translate(402, 260)" filter="url(#dfaPillShadow)">
                <rect
                  x="-26"
                  y="-10"
                  width="52"
                  height="20"
                  rx="6"
                  fill="#ffffff"
                  stroke="#64748b"
                  strokeWidth="1.4"
                />
                <text
                  x="0"
                  y="3.5"
                  textAnchor="middle"
                  fill="#334155"
                  fontSize="9.5"
                  fontWeight="900"
                >
                  a → ∅
                </text>
              </g>
            </g>

            {/* [C,D,F] --b--> [∅] */}
            <g>
              <path
                d="M 632 156 Q 595 270 505 350"
                fill="none"
                stroke="#ffffff"
                strokeWidth="6"
                opacity="0.85"
              />
              <path
                d="M 632 156 Q 595 270 505 350"
                fill="none"
                stroke={isEdgeActive('[C,D,F]-b-[∅]', '[C,D,F]', ['b']) ? '#e11d48' : '#94a3b8'}
                strokeWidth={isEdgeActive('[C,D,F]-b-[∅]', '[C,D,F]', ['b']) ? 3.8 : 2.3}
                strokeDasharray="6,4"
                markerEnd="url(#dfaArrowSlate)"
              />
              <g transform="translate(580, 260)" filter="url(#dfaPillShadow)">
                <rect
                  x="-26"
                  y="-10"
                  width="52"
                  height="20"
                  rx="6"
                  fill="#ffffff"
                  stroke="#64748b"
                  strokeWidth="1.4"
                />
                <text
                  x="0"
                  y="3.5"
                  textAnchor="middle"
                  fill="#334155"
                  fontSize="9.5"
                  fontWeight="900"
                >
                  b → ∅
                </text>
              </g>
            </g>

            {/* [E,D,F] --b--> [∅] */}
            <g>
              <path
                d="M 860 241 Q 755 365 542 388"
                fill="none"
                stroke="#ffffff"
                strokeWidth="6"
                opacity="0.85"
              />
              <path
                d="M 860 241 Q 755 365 542 388"
                fill="none"
                stroke={isEdgeActive('[E,D,F]-b-[∅]', '[E,D,F]', ['b']) ? '#e11d48' : '#94a3b8'}
                strokeWidth={isEdgeActive('[E,D,F]-b-[∅]', '[E,D,F]', ['b']) ? 3.8 : 2.3}
                strokeDasharray="6,4"
                markerEnd="url(#dfaArrowSlate)"
              />
              <g transform="translate(725, 336)" filter="url(#dfaPillShadow)">
                <rect
                  x="-26"
                  y="-10"
                  width="52"
                  height="20"
                  rx="6"
                  fill="#ffffff"
                  stroke="#64748b"
                  strokeWidth="1.4"
                />
                <text
                  x="0"
                  y="3.5"
                  textAnchor="middle"
                  fill="#334155"
                  fontSize="9.5"
                  fontWeight="900"
                >
                  b → ∅
                </text>
              </g>
            </g>

            {/* [∅] self-loop a, b */}
            <g>
              <path
                d="M 536 398 C 598 378, 598 422, 536 404"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2.3"
                strokeDasharray="4,3"
                markerEnd="url(#dfaArrowSlate)"
              />
              <g transform="translate(612, 400)">
                <rect
                  x="-24"
                  y="-9"
                  width="48"
                  height="18"
                  rx="5"
                  fill="#f1f5f9"
                  stroke="#94a3b8"
                  strokeWidth="1.2"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fill="#475569"
                  fontSize="9"
                  fontWeight="900"
                >
                  a, b
                </text>
              </g>
            </g>

            {/* ================= DFA SUBSET STATION PLAQUES ================= */}
            {DFA_ORDER.map((id) => {
              const dfa = DFA_STATIONS[id];
              const pos = DEFAULT_DFA_POSITIONS[id] || { x: dfa.x, y: dfa.y };
              const isActive = currentDfaState === id;
              const isDead = id === '[∅]';

              return (
                <DfaStationPlaque
                  key={id}
                  id={id}
                  metroStation={dfa.metroName}
                  x={pos.x}
                  y={pos.y}
                  isAccept={dfa.ef === '1'}
                  isDead={isDead}
                  isActive={isActive}
                  onSelect={onSelectDfaState}
                />
              );
            })}
          </svg>
        </div>
        {caption && (
          <div className="text-xs text-slate-600 font-medium px-2">{caption}</div>
        )}
      </div>
    );
  }

  // ============================================================================
  // CASE 2: Dynamic SVG Layout for Any Exercise or Custom Regex Bundle
  // ============================================================================
  const { nodes, edges, width, height } = bundle.dfaLayout;
  const nodeMap = new Map<string, { x: number; y: number }>(
    nodes.map((n) => [n.id, { x: n.x, y: n.y }])
  );
  const startNode = nodes.find((n) => n.isStart) || nodes[0];
  const halfW = 66;
  const halfH = 36;

  return (
    <div className="w-full space-y-2">
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label={`Diagrama de Estados AFD para ${bundle.spec.title}`}
        >
          <defs>
            <pattern id="dfaGridDyn" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
            </pattern>
            <marker
              id="dfaDynPink"
              viewBox="0 0 10 10"
              refX="8.5"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#F04E98" />
            </marker>
            <marker
              id="dfaDynBlue"
              viewBox="0 0 10 10"
              refX="8.5"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#005EB8" />
            </marker>
            <marker
              id="dfaDynMulti"
              viewBox="0 0 10 10"
              refX="8.5"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#FF6B00" />
            </marker>
            <marker
              id="dfaDynSlate"
              viewBox="0 0 10 10"
              refX="8.5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
            </marker>
            <marker
              id="dfaDynStart"
              viewBox="0 0 10 10"
              refX="8.5"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#0f172a" />
            </marker>
            <filter id="dfaNodeShadow" x="-20%" y="-20%" width="140%" height="145%">
              <feDropShadow dx="0" dy="4" stdDeviation="4.5" floodColor="#0f172a" floodOpacity="0.16" />
            </filter>
            <filter id="dfaPillShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.15" />
            </filter>
          </defs>

          <rect
            x="8"
            y="8"
            width={width - 16}
            height={height - 16}
            rx="20"
            fill="url(#dfaGridDyn)"
            stroke="#cbd5e1"
            strokeWidth="1.2"
          />

          {/* Top Title Banner */}
          <g transform="translate(22, 20)">
            <rect x="0" y="0" width="420" height="28" rx="8" fill="#0f172a" />
            <circle cx="14" cy="14" r="4.5" fill="#10b981" />
            <text
              x="26"
              y="18"
              fill="#ffffff"
              fontSize="10.5"
              fontWeight="900"
              letterSpacing="0.06em"
            >
              {`CORRESPONDENCIAS AFD · ${bundle.spec.title}`}
            </text>
          </g>

          {/* Initial Arrow */}
          {startNode && (
            <g>
              <line
                x1={Math.max(14, startNode.x - 115)}
                y1={startNode.y}
                x2={startNode.x - halfW - 6}
                y2={startNode.y}
                stroke="#0f172a"
                strokeWidth="3.5"
                markerEnd="url(#dfaDynStart)"
              />
              <rect
                x={Math.max(12, startNode.x - 115)}
                y={startNode.y - 25}
                width="42"
                height="16"
                rx="4"
                fill="#0f172a"
              />
              <text
                x={Math.max(33, startNode.x - 94)}
                y={startNode.y - 14}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="8.5"
                fontWeight="900"
              >
                INICIO
              </text>
            </g>
          )}

          {/* Dynamic DFA Edges */}
          {edges.map((edge, idx) => {
            const fromPos = nodeMap.get(edge.from);
            const toPos = nodeMap.get(edge.to);
            if (!fromPos || !toPos) return null;

            const isToDead = edge.kind === 'dead' || edge.to === '[∅]';
            const isSelfLoop = edge.curve === 'self' || edge.from === edge.to;
            const curveOffset = edge.curveOffset ?? 0;
            const active = isEdgeActive(edge.id, edge.from, edge.symbols);
            const label = edge.symbols.join(', ');
            const isFirstSym =
              edge.symbols.length === 1 &&
              (edge.symbols[0] === 'a' || edge.symbols[0] === '0');
            const isSecondSym =
              edge.symbols.length === 1 &&
              (edge.symbols[0] === 'b' || edge.symbols[0] === '1');

            const strokeColor = isToDead
              ? active
                ? '#e11d48'
                : '#94a3b8'
              : isFirstSym
              ? '#F04E98'
              : isSecondSym
              ? '#005EB8'
              : '#FF6B00';

            const markerUrl = isToDead
              ? 'url(#dfaDynSlate)'
              : isFirstSym
              ? 'url(#dfaDynPink)'
              : isSecondSym
              ? 'url(#dfaDynBlue)'
              : 'url(#dfaDynMulti)';

            const pillW = Math.max(38, label.length * 9 + 20);

            if (isSelfLoop) {
              const loopDir = isToDead ? 1 : -1;
              const pathD =
                loopDir === -1
                  ? `M ${fromPos.x - 24} ${fromPos.y - halfH - 2} C ${fromPos.x - 48} ${
                      fromPos.y - 108
                    }, ${fromPos.x + 48} ${fromPos.y - 108}, ${fromPos.x + 24} ${
                      fromPos.y - halfH - 2
                    }`
                  : `M ${fromPos.x + halfW + 2} ${fromPos.y - 8} C ${
                      fromPos.x + halfW + 58
                    } ${fromPos.y - 26}, ${fromPos.x + halfW + 58} ${
                      fromPos.y + 26
                    }, ${fromPos.x + halfW + 2} ${fromPos.y + 8}`;

              const badgeX = loopDir === -1 ? fromPos.x : fromPos.x + halfW + 58;
              const badgeY = loopDir === -1 ? fromPos.y - 92 : fromPos.y;

              return (
                <g key={`dfa-dyn-edge-${idx}`}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="7"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={active ? 4.5 : isToDead ? 2.2 : 3.4}
                    strokeDasharray={isToDead ? '5,4' : undefined}
                    markerEnd={markerUrl}
                  />
                  <g transform={`translate(${badgeX}, ${badgeY})`} filter="url(#dfaPillShadow)">
                    <rect
                      x={-pillW / 2}
                      y="-11"
                      width={pillW}
                      height="22"
                      rx="7"
                      fill={isToDead ? '#f8fafc' : strokeColor}
                      stroke={isToDead ? '#94a3b8' : '#ffffff'}
                      strokeWidth="1.4"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill={isToDead ? '#475569' : '#ffffff'}
                      fontSize="10"
                      fontWeight="900"
                    >
                      {label}
                    </text>
                  </g>
                </g>
              );
            }

            // Compute quadratic Bezier control point first so boundary clipping aims along the curve tangent!
            const dx = toPos.x - fromPos.x;
            const dy = toPos.y - fromPos.y;
            const dist = Math.hypot(dx, dy) || 1;
            const nx = -dy / dist;
            const ny = dx / dist;
            const midX = (fromPos.x + toPos.x) / 2 + nx * curveOffset;
            const midY = (fromPos.y + toPos.y) / 2 + ny * curveOffset;

            const startPt = getBoxBoundaryPoint(
              fromPos.x,
              fromPos.y,
              midX,
              midY,
              halfW + 3,
              halfH + 3
            );
            const endPt = getBoxBoundaryPoint(
              toPos.x,
              toPos.y,
              midX,
              midY,
              halfW + 7,
              halfH + 7
            );

            const pathD = `M ${startPt.x} ${startPt.y} Q ${midX} ${midY} ${endPt.x} ${endPt.y}`;

            // Stagger label t parameter slightly on curved edges to prevent center collisions
            const t = curveOffset > 0 ? 0.46 : curveOffset < 0 ? 0.54 : 0.5;
            const oneMinusT = 1 - t;
            const labelX =
              oneMinusT * oneMinusT * startPt.x +
              2 * oneMinusT * t * midX +
              t * t * endPt.x;
            const labelY =
              oneMinusT * oneMinusT * startPt.y +
              2 * oneMinusT * t * midY +
              t * t * endPt.y;

            return (
              <g key={`dfa-dyn-edge-${idx}`}>
                <path
                  d={pathD}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={isToDead ? 6 : 8}
                  strokeLinecap="round"
                  opacity="0.9"
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={active ? 4.8 : isToDead ? 2.2 : 3.5}
                  strokeDasharray={isToDead ? '6,4' : undefined}
                  markerEnd={markerUrl}
                />
                <g transform={`translate(${labelX}, ${labelY})`} filter="url(#dfaPillShadow)">
                  <rect
                    x={-pillW / 2}
                    y="-11"
                    width={pillW}
                    height="22"
                    rx="7"
                    fill={isToDead ? '#ffffff' : strokeColor}
                    stroke={isToDead ? '#64748b' : '#ffffff'}
                    strokeWidth="1.5"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill={isToDead ? '#334155' : '#ffffff'}
                    fontSize="10"
                    fontWeight="900"
                  >
                    {isToDead ? `${label} → ∅` : label}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Dynamic DFA Nodes */}
          {nodes.map((node) => {
            const isActive = currentDfaState === node.id;
            return (
              <DfaStationPlaque
                key={node.id}
                id={node.id}
                metroStation={node.subtitle || node.id}
                x={node.x}
                y={node.y}
                isAccept={node.isAccept}
                isDead={!!node.isDeadEnd || node.id === '[∅]'}
                isActive={isActive}
                onSelect={onSelectDfaState}
              />
            );
          })}
        </svg>
      </div>
      {caption && (
        <div className="text-xs text-slate-600 font-medium px-2">{caption}</div>
      )}
    </div>
  );
};
