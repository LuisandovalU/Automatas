import React from 'react';
import { NFA_STATIONS, NFA_TRANSITIONS } from '../data/automataData';
import { SolvedMethodBundle } from '../engine/automataMethodEngine';
import { getStationVisualSpec, CDMX_LINES } from '../data/cdmxLinesData';
import { CdmxStationGlyphSvg } from './CdmxStationGlyphSvg';

interface MetroMapNFAProps {
  bundle?: SolvedMethodBundle;
  activeStates: string[];
  highlightedTransitions?: string[];
  highlightedEpsilonPath?: string[];
  selectedStation?: string;
  onSelectStation?: (stateId: string) => void;
  onSelectState?: (stateId: string) => void;
  showNewAccepts?: boolean;
  showClosureBadge?: boolean;
  caption?: string;
}

const DEFAULT_POSITIONS: Record<string, { x: number; y: number }> = {
  A: { x: 105, y: 185 },
  B: { x: 255, y: 185 },
  C: { x: 405, y: 185 },
  D: { x: 555, y: 185 },
  E: { x: 705, y: 185 },
  F: { x: 855, y: 185 },
};

const SYMBOL_STYLE: Record<string, { stroke: string; badgeBg: string; label: string; dash?: string }> = {
  a: { stroke: '#F04E98', badgeBg: '#F04E98', label: 'a · L1 Rosa' },
  b: { stroke: '#005EB8', badgeBg: '#005EB8', label: 'b · L2 Azul' },
  c: { stroke: '#AF9800', badgeBg: '#AF9800', label: 'c · L3 Olivo' },
  '0': { stroke: '#F04E98', badgeBg: '#F04E98', label: '0 · L1 Rosa' },
  '1': { stroke: '#005EB8', badgeBg: '#005EB8', label: '1 · L2 Azul' },
  'ε': { stroke: '#10b981', badgeBg: '#059669', label: 'ε · Transbordo Libre', dash: '7,4' },
};

function getSymbolStyle(symbol: string) {
  return (
    SYMBOL_STYLE[symbol] || {
      stroke: '#FF6B00',
      badgeBg: '#FF6B00',
      label: `${symbol} · Vía Metro`,
    }
  );
}

interface NfaStationPlaqueProps {
  id: string;
  metroName: string;
  x: number;
  y: number;
  isOriginalAccept?: boolean;
  isNewAccept?: boolean;
  showNewAccepts?: boolean;
  isActive: boolean;
  isSelected: boolean;
  showClosureBadge: boolean;
  closureSet?: string[];
  onSelect?: (id: string) => void;
}

const NfaStationPlaque: React.FC<NfaStationPlaqueProps> = ({
  id,
  metroName,
  x,
  y,
  isOriginalAccept,
  isNewAccept,
  showNewAccepts = true,
  isActive,
  isSelected,
  showClosureBadge,
  closureSet,
  onSelect,
}) => {
  const spec = getStationVisualSpec(id);
  const w = 68;
  const h = 76;
  const halfW = w / 2;
  const halfH = h / 2;
  const clipId = `nfa-plaque-clip-${id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const bandWidth = w / Math.max(1, spec.lines.length);

  const isAccept = isOriginalAccept || (showNewAccepts && isNewAccept);
  const shortName =
    metroName.length > 13 ? `${metroName.slice(0, 12)}…` : metroName;

  return (
    <g
      onClick={() => onSelect?.(id)}
      style={{ cursor: 'pointer' }}
      role="button"
      aria-label={`Estación ${id} (${metroName})`}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={x - halfW} y={y - halfH} width={w} height={h} rx="13" />
        </clipPath>
      </defs>

      {/* Active or Selected pulse halo */}
      {(isActive || isSelected) && (
        <rect
          x={x - halfW - 8}
          y={y - halfH - 8}
          width={w + 16}
          height={h + 16}
          rx="18"
          fill="none"
          stroke={isActive ? '#FF6B00' : '#0284c7'}
          strokeWidth="3.2"
          opacity="0.52"
        />
      )}

      {/* Double border ring for accepting states (EF=1) */}
      {isAccept && (
        <rect
          x={x - halfW - 5}
          y={y - halfH - 5}
          width={w + 10}
          height={h + 10}
          rx="16"
          fill="none"
          stroke={isOriginalAccept ? '#059669' : '#10b981'}
          strokeWidth="2.6"
          strokeDasharray={isOriginalAccept ? undefined : '5,2.5'}
        />
      )}

      {/* Official STC Metro station plaque body */}
      <g clipPath={`url(#${clipId})`} filter="url(#nfaCardShadow)">
        <rect
          x={x - halfW}
          y={y - halfH}
          width={w}
          height={h}
          rx="13"
          fill={spec.primaryColor}
        />

        {/* Multi-line vertical correspondence bands at top header */}
        {spec.lines.map((lineId, idx) => {
          const lineColor = CDMX_LINES[lineId]?.color || spec.primaryColor;
          return (
            <rect
              key={`${id}-band-${lineId}-${idx}`}
              x={x - halfW + idx * bandWidth}
              y={y - halfH}
              width={bandWidth + 0.5}
              height={11}
              fill={lineColor}
            />
          );
        })}

        {/* Subtle inner contrast sheen */}
        <rect
          x={x - halfW}
          y={y - halfH + 11}
          width={w}
          height={42}
          fill="#0f172a"
          opacity="0.14"
        />

        {/* Bottom dark STC nameplate band */}
        <rect
          x={x - halfW}
          y={y + halfH - 23}
          width={w}
          height={23}
          fill="#0f172a"
          opacity="0.93"
        />
        <line
          x1={x - halfW}
          y1={y + halfH - 23}
          x2={x + halfW}
          y2={y + halfH - 23}
          stroke="#ffffff"
          strokeWidth="1"
          opacity="0.35"
        />
      </g>

      {/* Outer crisp border */}
      <rect
        x={x - halfW}
        y={y - halfH}
        width={w}
        height={h}
        rx="13"
        fill="none"
        stroke={isActive ? '#FF6B00' : isSelected ? '#0284c7' : '#0f172a'}
        strokeWidth={isActive || isSelected ? 3.2 : 2.2}
      />

      {/* Official STC Metro Pictogram centered inside upper zone */}
      <g transform={`translate(${x}, ${y - 9}) scale(1.06)`}>
        <CdmxStationGlyphSvg
          glyphId={spec.glyphId}
          memberGlyphs={spec.memberGlyphs}
          color="#ffffff"
        />
      </g>

      {/* State ID badge in top-right corner */}
      <g transform={`translate(${x + halfW - 11}, ${y - halfH + 11})`}>
        <rect
          x="-11"
          y="-9"
          width="22"
          height="17"
          rx="5"
          fill="#0f172a"
          stroke="#ffffff"
          strokeWidth="1.4"
        />
        <text
          x="0"
          y="3.5"
          textAnchor="middle"
          fill="#ffffff"
          fontSize={id.length > 2 ? '8.5' : '10.5'}
          fontWeight="900"
          fontFamily="monospace"
        >
          {id}
        </text>
      </g>

      {/* Accepting state mini pill on top-left */}
      {isAccept && (
        <g transform={`translate(${x - halfW + 14}, ${y - halfH + 10})`}>
          <rect
            x="-13"
            y="-8"
            width="26"
            height="14"
            rx="4"
            fill="#059669"
            stroke="#ffffff"
            strokeWidth="1.1"
          />
          <text
            x="0"
            y="2"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="7"
            fontWeight="900"
          >
            EF=1
          </text>
        </g>
      )}

      {/* Official Station Name inside bottom dark band */}
      <text
        x={x}
        y={y + halfH - 12}
        textAnchor="middle"
        fill="#ffffff"
        fontSize="7.6"
        fontWeight="900"
        letterSpacing="0.01em"
      >
        {shortName}
      </text>

      {/* Official Line number mini squares inside bottom edge */}
      <g
        transform={`translate(${
          x - (Math.min(4, spec.lines.length) * 11) / 2
        }, ${y + halfH - 9.5})`}
      >
        {spec.lines.slice(0, 4).map((lineId, idx) => {
          const lineSpec = CDMX_LINES[lineId];
          if (!lineSpec) return null;
          return (
            <g key={`${id}-mini-sq-${lineId}`} transform={`translate(${idx * 11}, 0)`}>
              <rect
                x="0"
                y="0"
                width="9.5"
                height="8"
                rx="2"
                fill={lineSpec.color}
                stroke="#ffffff"
                strokeWidth="0.6"
              />
              <text
                x="4.75"
                y="6"
                textAnchor="middle"
                fill={lineSpec.textColor}
                fontSize="5.8"
                fontWeight="900"
              >
                {lineId}
              </text>
            </g>
          );
        })}
      </g>

      {/* Active train indicator badge */}
      {isActive && (
        <g transform={`translate(${x}, ${y - halfH - 14})`}>
          <rect
            x="-24"
            y="-9"
            width="48"
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

      {/* Optional C-ε(q) pill below plaque */}
      {showClosureBadge && closureSet && closureSet.length > 0 && (
        <g transform={`translate(${x}, ${y + halfH + 15})`}>
          <rect
            x="-36"
            y="-9"
            width="72"
            height="17"
            rx="6"
            fill="#ecfdf5"
            stroke="#10b981"
            strokeWidth="1.2"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fill="#047857"
            fontSize="7.8"
            fontWeight="900"
            fontFamily="monospace"
          >
            {`{${closureSet.join(',')}}`}
          </text>
        </g>
      )}
    </g>
  );
};

export const MetroMapNFA: React.FC<MetroMapNFAProps> = ({
  bundle,
  activeStates,
  highlightedTransitions = [],
  highlightedEpsilonPath = [],
  selectedStation,
  onSelectStation,
  onSelectState,
  showNewAccepts = true,
  showClosureBadge = true,
  caption,
}) => {
  const handleSelect = (id: string) => {
    onSelectStation?.(id);
    onSelectState?.(id);
  };

  const isCustomBundle = bundle && bundle.spec.id !== 'a2-ab-astar';

  const isEdgeHighlighted = (edgeId: string, from: string, to: string, symbol: string) => {
    if (highlightedTransitions.includes(edgeId)) return true;
    if (
      symbol === 'ε' &&
      highlightedEpsilonPath.includes(from) &&
      highlightedEpsilonPath.includes(to)
    ) {
      return true;
    }
    return activeStates.includes(from) && activeStates.includes(to);
  };

  // ============================================================================
  // CASE 1: Masterpiece layout for the canonical (ab)a* NFA-ε
  // ============================================================================
  if (!isCustomBundle) {
    const halfW = 34;
    const halfH = 38;
    const baseY = 185;
    const nfaStationsList = Object.values(NFA_STATIONS);

    return (
      <div className="w-full space-y-2">
        <div className="w-full overflow-x-auto">
          <svg
            viewBox="0 0 960 365"
            className="w-full h-auto select-none"
            role="img"
            aria-label="Diagrama de Red Metro AFN con transiciones épsilon para (ab)a*"
          >
            <defs>
              <pattern id="nfaGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path
                  d="M 24 0 L 0 0 0 24"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="0.8"
                />
              </pattern>

              <marker
                id="arrowPink"
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
                id="arrowBlue"
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
                id="arrowEmerald"
                viewBox="0 0 10 10"
                refX="8.5"
                refY="5"
                markerWidth="6.5"
                markerHeight="6.5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
              </marker>
              <marker
                id="arrowStart"
                viewBox="0 0 10 10"
                refX="8.5"
                refY="5"
                markerWidth="6.5"
                markerHeight="6.5"
                orient="auto"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#0f172a" />
              </marker>

              <filter id="nfaCardShadow" x="-20%" y="-20%" width="140%" height="145%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.18" />
              </filter>
              <filter id="nfaPillShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.16" />
              </filter>
            </defs>

            {/* Subtle Metro blueprint background */}
            <rect
              x="8"
              y="8"
              width="944"
              height="349"
              rx="20"
              fill="url(#nfaGrid)"
              stroke="#cbd5e1"
              strokeWidth="1.2"
            />

            {/* Top Title Banner inside SVG */}
            <g transform="translate(24, 24)">
              <rect
                x="0"
                y="0"
                width="380"
                height="30"
                rx="9"
                fill="#0f172a"
              />
              <circle cx="15" cy="15" r="5" fill="#FF6B00" />
              <text
                x="28"
                y="19"
                fill="#ffffff"
                fontSize="11"
                fontWeight="900"
                letterSpacing="0.06em"
              >
                PLANO OFICIAL STC METRO AFN-ε · ER = (ab)a*
              </text>
            </g>

            {/* Initial Entry Arrow -> A */}
            <g>
              <line
                x1="24"
                y1={baseY}
                x2={DEFAULT_POSITIONS.A.x - halfW - 4}
                y2={baseY}
                stroke="#0f172a"
                strokeWidth="3.5"
                markerEnd="url(#arrowStart)"
              />
              <rect
                x="16"
                y={baseY - 26}
                width="44"
                height="16"
                rx="4"
                fill="#0f172a"
              />
              <text
                x="38"
                y={baseY - 15}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="8.5"
                fontWeight="900"
                letterSpacing="0.06em"
              >
                INICIO
              </text>
            </g>

            {/* ================= TRANSITION TRACKS ================= */}
            {NFA_TRANSITIONS.map((t) => {
              const fromPos = DEFAULT_POSITIONS[t.from];
              const toPos = DEFAULT_POSITIONS[t.to];
              const style = getSymbolStyle(t.label);
              const highlighted = isEdgeHighlighted(t.id, t.from, t.to, t.label);
              const markerId =
                t.label === 'a'
                  ? 'url(#arrowPink)'
                  : t.label === 'b'
                  ? 'url(#arrowBlue)'
                  : 'url(#arrowEmerald)';

              if (t.from === 'E' && t.to === 'D') {
                // E -> D top loop (Retroceso 'ε' de Kleene a*)
                const startX = fromPos.x - 8;
                const startY = fromPos.y - halfH - 2;
                const endX = toPos.x + 8;
                const endY = toPos.y - halfH - 2;
                const midX = (startX + endX) / 2;
                const ctrlY = 44;
                const pathD = `M ${startX} ${startY} Q ${midX} ${ctrlY} ${endX} ${endY}`;
                const labelY = 0.25 * startY + 0.5 * ctrlY + 0.25 * endY;

                return (
                  <g key={t.id}>
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth={highlighted ? 9 : 7}
                      strokeLinecap="round"
                      opacity="0.9"
                    />
                    <path
                      d={pathD}
                      fill="none"
                      stroke={style.stroke}
                      strokeWidth={highlighted ? 4.5 : 3.2}
                      strokeDasharray={style.dash}
                      markerEnd={markerId}
                    />
                    <g transform={`translate(${midX}, ${labelY - 2})`} filter="url(#nfaPillShadow)">
                      <rect
                        x="-62"
                        y="-12"
                        width="124"
                        height="22"
                        rx="11"
                        fill="#ffffff"
                        stroke={style.stroke}
                        strokeWidth="2"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fill="#0f172a"
                        fontSize="10"
                        fontWeight="900"
                      >
                        ε (Ciclo Kleene a*)
                      </text>
                    </g>
                  </g>
                );
              }

              if (t.from === 'C' && t.to === 'F') {
                // C -> F bottom bypass (Puente ε que salta a* cuando hay 0 repeticiones)
                const startX = fromPos.x + 6;
                const startY = fromPos.y + halfH + 3;
                const endX = toPos.x - 6;
                const endY = toPos.y + halfH + 3;
                const midX = (startX + endX) / 2;
                const ctrlY = 342;
                const pathD = `M ${startX} ${startY} Q ${midX} ${ctrlY} ${endX} ${endY}`;
                const labelY = 0.25 * startY + 0.5 * ctrlY + 0.25 * endY;

                return (
                  <g key={t.id}>
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth={highlighted ? 9 : 7}
                      strokeLinecap="round"
                      opacity="0.92"
                    />
                    <path
                      d={pathD}
                      fill="none"
                      stroke={style.stroke}
                      strokeWidth={highlighted ? 4.5 : 3.2}
                      strokeDasharray={style.dash}
                      markerEnd={markerId}
                    />
                    <g transform={`translate(${midX}, ${labelY})`} filter="url(#nfaPillShadow)">
                      <rect
                        x="-78"
                        y="-12"
                        width="156"
                        height="22"
                        rx="11"
                        fill="#ffffff"
                        stroke={style.stroke}
                        strokeWidth="2"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fill="#0f172a"
                        fontSize="10"
                        fontWeight="900"
                      >
                        ε (Bypass Directo a Salida F)
                      </text>
                    </g>
                  </g>
                );
              }

              // Straight horizontal track between adjacent stations
              const x1 = fromPos.x + halfW + 2;
              const x2 = toPos.x - halfW - 5;
              const y = fromPos.y;
              const midX = (x1 + x2) / 2;

              return (
                <g key={t.id}>
                  <line
                    x1={x1}
                    y1={y}
                    x2={x2}
                    y2={y}
                    stroke="#ffffff"
                    strokeWidth="9"
                    strokeLinecap="round"
                  />
                  <line
                    x1={x1}
                    y1={y}
                    x2={x2}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeWidth="6.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1={x1}
                    y1={y}
                    x2={x2}
                    y2={y}
                    stroke={style.stroke}
                    strokeWidth={highlighted ? 4.8 : 3.8}
                    strokeDasharray={style.dash}
                    markerEnd={markerId}
                  />
                  <g transform={`translate(${midX}, ${y - 22})`} filter="url(#nfaPillShadow)">
                    <rect
                      x="-17"
                      y="-11"
                      width="34"
                      height="21"
                      rx="7"
                      fill={style.badgeBg}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="11.5"
                      fontWeight="900"
                    >
                      {t.label}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* ================= STATION PLAQUES (A..F) ================= */}
            {nfaStationsList.map((st) => {
              const pos = DEFAULT_POSITIONS[st.id];
              const isActive = activeStates.includes(st.id);
              const isSelected = selectedStation === st.id;

              return (
                <NfaStationPlaque
                  key={st.id}
                  id={st.id}
                  metroName={st.metroName}
                  x={pos.x}
                  y={pos.y}
                  isOriginalAccept={st.isOriginalAccept}
                  isNewAccept={st.isNewAccept}
                  showNewAccepts={showNewAccepts}
                  isActive={isActive}
                  isSelected={isSelected}
                  showClosureBadge={showClosureBadge}
                  closureSet={st.epsilonClosure}
                  onSelect={handleSelect}
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
  const { nodes, edges, width, height } = bundle.nfaLayout;
  const nodeMap = new Map<string, { x: number; y: number }>(
    nodes.map((n) => [n.id, { x: n.x, y: n.y }])
  );
  const startNode = nodes.find((n) => n.isStart) || nodes[0];
  const halfW = 34;
  const halfH = 38;

  return (
    <div className="w-full space-y-2">
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label={`Diagrama de Red Metro AFN-ε para ${bundle.spec.title}`}
        >
          <defs>
            <pattern id="nfaGridDyn" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
            </pattern>
            <marker
              id="dynArrowA"
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
              id="dynArrowB"
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
              id="dynArrowC"
              viewBox="0 0 10 10"
              refX="8.5"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#AF9800" />
            </marker>
            <marker
              id="dynArrowEps"
              viewBox="0 0 10 10"
              refX="8.5"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
            </marker>
            <marker
              id="dynArrowStart"
              viewBox="0 0 10 10"
              refX="8.5"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#0f172a" />
            </marker>
            <filter id="nfaCardShadow" x="-20%" y="-20%" width="140%" height="145%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.18" />
            </filter>
            <filter id="nfaPillShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.16" />
            </filter>
          </defs>

          <rect
            x="8"
            y="8"
            width={width - 16}
            height={height - 16}
            rx="20"
            fill="url(#nfaGridDyn)"
            stroke="#cbd5e1"
            strokeWidth="1.2"
          />

          {/* Top Title Banner inside Dynamic SVG */}
          <g transform="translate(22, 20)">
            <rect x="0" y="0" width="380" height="28" rx="8" fill="#0f172a" />
            <circle cx="14" cy="14" r="4.5" fill="#FF6B00" />
            <text
              x="26"
              y="18"
              fill="#ffffff"
              fontSize="10.5"
              fontWeight="900"
              letterSpacing="0.06em"
            >
              {`PLANO STC METRO AFN-ε · ${bundle.spec.title}`}
            </text>
          </g>

          {/* Initial Entry Arrow */}
          {startNode && (
            <g>
              <line
                x1={Math.max(18, startNode.x - 95)}
                y1={startNode.y}
                x2={startNode.x - halfW - 5}
                y2={startNode.y}
                stroke="#0f172a"
                strokeWidth="3.5"
                markerEnd="url(#dynArrowStart)"
              />
              <rect
                x={Math.max(14, startNode.x - 96)}
                y={startNode.y - 25}
                width="44"
                height="16"
                rx="4"
                fill="#0f172a"
              />
              <text
                x={Math.max(36, startNode.x - 74)}
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

          {/* Dynamic Edges */}
          {edges.map((edge, idx) => {
            const fromPos = nodeMap.get(edge.from);
            const toPos = nodeMap.get(edge.to);
            if (!fromPos || !toPos) return null;

            const style = getSymbolStyle(edge.label);
            const highlighted = isEdgeHighlighted(edge.id, edge.from, edge.to, edge.label);
            const markerId =
              edge.label === 'a' || edge.label === '0'
                ? 'url(#dynArrowA)'
                : edge.label === 'b' || edge.label === '1'
                ? 'url(#dynArrowB)'
                : edge.label === 'c'
                ? 'url(#dynArrowC)'
                : 'url(#dynArrowEps)';

            if (edge.curve === 'self' || edge.from === edge.to) {
              const pathD = `M ${fromPos.x - 14} ${fromPos.y - halfH - 2} C ${fromPos.x - 36} ${
                fromPos.y - 110
              }, ${fromPos.x + 36} ${fromPos.y - 110}, ${fromPos.x + 14} ${fromPos.y - halfH - 2}`;
              return (
                <g key={`dyn-edge-${idx}`}>
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
                    stroke={style.stroke}
                    strokeWidth={highlighted ? 4.2 : 3}
                    strokeDasharray={style.dash}
                    markerEnd={markerId}
                  />
                  <g transform={`translate(${fromPos.x}, ${fromPos.y - 96})`} filter="url(#nfaPillShadow)">
                    <rect
                      x="-16"
                      y="-10"
                      width="32"
                      height="20"
                      rx="6"
                      fill={style.badgeBg}
                      stroke="#ffffff"
                      strokeWidth="1.4"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10.5"
                      fontWeight="900"
                    >
                      {edge.label}
                    </text>
                  </g>
                </g>
              );
            }

            if (edge.curve === 'top' || edge.curve === 'bottom') {
              const isTop = edge.curve === 'top';
              const startX = fromPos.x + (toPos.x >= fromPos.x ? 8 : -8);
              const startY = fromPos.y + (isTop ? -(halfH + 2) : halfH + 3);
              const endX = toPos.x + (toPos.x >= fromPos.x ? -8 : 8);
              const endY = toPos.y + (isTop ? -(halfH + 2) : halfH + 3);
              const midX = (startX + endX) / 2;
              const offset =
                edge.curveOffset !== undefined
                  ? edge.curveOffset
                  : isTop
                  ? -95
                  : 95;
              const ctrlY = Math.max(
                28,
                Math.min(height - 24, (startY + endY) / 2 + offset)
              );
              const pathD = `M ${startX} ${startY} Q ${midX} ${ctrlY} ${endX} ${endY}`;
              const labelY = 0.25 * startY + 0.5 * ctrlY + 0.25 * endY;

              return (
                <g key={`dyn-edge-${idx}`}>
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
                    stroke={style.stroke}
                    strokeWidth={highlighted ? 4.2 : 3}
                    strokeDasharray={style.dash}
                    markerEnd={markerId}
                  />
                  <g transform={`translate(${midX}, ${labelY})`} filter="url(#nfaPillShadow)">
                    <rect
                      x="-17"
                      y="-10"
                      width="34"
                      height="20"
                      rx="7"
                      fill={style.badgeBg}
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
                      {edge.label}
                    </text>
                  </g>
                </g>
              );
            }

            // Straight segment with exact rectangular boundary clipping
            const dx = toPos.x - fromPos.x;
            const dy = toPos.y - fromPos.y;
            const dist = Math.hypot(dx, dy) || 1;
            const ux = dx / dist;
            const uy = dy / dist;
            const txStart = Math.abs(ux) > 0.001 ? (halfW + 3) / Math.abs(ux) : Infinity;
            const tyStart = Math.abs(uy) > 0.001 ? (halfH + 3) / Math.abs(uy) : Infinity;
            const tStart = Math.min(txStart, tyStart);

            const txEnd = Math.abs(ux) > 0.001 ? (halfW + 6) / Math.abs(ux) : Infinity;
            const tyEnd = Math.abs(uy) > 0.001 ? (halfH + 6) / Math.abs(uy) : Infinity;
            const tEnd = Math.min(txEnd, tyEnd);

            const x1 = fromPos.x + ux * tStart;
            const y1 = fromPos.y + uy * tStart;
            const x2 = toPos.x - ux * tEnd;
            const y2 = toPos.y - uy * tEnd;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            return (
              <g key={`dyn-edge-${idx}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#ffffff"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={style.stroke}
                  strokeWidth={highlighted ? 4.2 : 3.2}
                  strokeDasharray={style.dash}
                  markerEnd={markerId}
                />
                <g transform={`translate(${midX}, ${midY - 15})`} filter="url(#nfaPillShadow)">
                  <rect
                    x="-16"
                    y="-10"
                    width="32"
                    height="20"
                    rx="6"
                    fill={style.badgeBg}
                    stroke="#ffffff"
                    strokeWidth="1.4"
                  />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10.5"
                    fontWeight="900"
                  >
                    {edge.label}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Dynamic Nodes */}
          {nodes.map((node) => {
            const stInfo = bundle.stations[node.id];
            const isActive = activeStates.includes(node.id);
            const isSelected = selectedStation === node.id;

            return (
              <NfaStationPlaque
                key={node.id}
                id={node.id}
                metroName={stInfo?.metroName || node.subtitle || node.id}
                x={node.x}
                y={node.y}
                isOriginalAccept={stInfo?.isOriginalAccept ?? node.isAccept}
                isNewAccept={stInfo?.isNewAccept ?? node.isAccept}
                showNewAccepts={showNewAccepts}
                isActive={isActive}
                isSelected={isSelected}
                showClosureBadge={showClosureBadge}
                closureSet={stInfo?.epsilonClosure}
                onSelect={handleSelect}
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
