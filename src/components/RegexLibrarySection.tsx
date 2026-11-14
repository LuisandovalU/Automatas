import React, { useState } from 'react';
import { REGEX_LIBRARY, RegexPatternGuide } from '../data/regexLibraryData';
import { getStationVisualSpec } from '../data/cdmxLinesData';
import { CdmxStationGlyphSvg } from './CdmxStationGlyphSvg';

interface RegexLibrarySectionProps {
  selectedCardId?: string;
  onSelectCard?: (id: string) => void;
}

const MiniRegexDiagram: React.FC<{ card: RegexPatternGuide }> = ({ card }) => {
  const getStroke = (sym: string) => {
    if (sym === 'a') return '#F04E98';
    if (sym === 'b') return '#005EB8';
    return '#10b981';
  };

  const getMarker = (sym: string) => {
    if (sym === 'a') return `url(#miniPink-${card.id})`;
    if (sym === 'b') return `url(#miniBlue-${card.id})`;
    return `url(#miniEmerald-${card.id})`;
  };

  return (
    <svg
      viewBox="0 0 560 220"
      className="w-full h-36 bg-slate-50 rounded-xl border border-slate-200 select-none"
      role="img"
      aria-label={`Diagrama de ${card.title}`}
    >
      <defs>
        <pattern
          id={`miniGrid-${card.id}`}
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 20 0 L 0 0 0 20"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="0.6"
          />
        </pattern>
        <marker
          id={`miniPink-${card.id}`}
          viewBox="0 0 10 10"
          refX="8.5"
          refY="5"
          markerWidth="5.5"
          markerHeight="5.5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#F04E98" />
        </marker>
        <marker
          id={`miniBlue-${card.id}`}
          viewBox="0 0 10 10"
          refX="8.5"
          refY="5"
          markerWidth="5.5"
          markerHeight="5.5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#005EB8" />
        </marker>
        <marker
          id={`miniEmerald-${card.id}`}
          viewBox="0 0 10 10"
          refX="8.5"
          refY="5"
          markerWidth="5.5"
          markerHeight="5.5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
        </marker>
        <marker
          id={`miniStart-${card.id}`}
          viewBox="0 0 10 10"
          refX="8.5"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#0f172a" />
        </marker>
      </defs>

      <rect
        x="4"
        y="4"
        width="552"
        height="212"
        rx="12"
        fill={`url(#miniGrid-${card.id})`}
      />

      {/* Entry arrow to first node */}
      {card.nodes.length > 0 && (
        <line
          x1={Math.max(8, card.nodes[0].x - 48)}
          y1={card.nodes[0].y}
          x2={card.nodes[0].x - 24}
          y2={card.nodes[0].y}
          stroke="#0f172a"
          strokeWidth="2.5"
          markerEnd={`url(#miniStart-${card.id})`}
        />
      )}

      {/* Edges */}
      {card.edges.map((e, idx) => {
        const from = card.nodes.find((n) => n.id === e.from);
        const to = card.nodes.find((n) => n.id === e.to);
        if (!from || !to) return null;

        const stroke = getStroke(e.label);
        const dash = e.label === 'ε' ? '5,3' : undefined;

        if (e.curve === 'top') {
          const startX = from.x;
          const startY = from.y - 21;
          const endX = to.x;
          const endY = to.y - 21;
          const midX = (startX + endX) / 2;
          const ctrlY = 18;
          const d = `M ${startX} ${startY} Q ${midX} ${ctrlY} ${endX} ${endY}`;
          const labelY = 0.25 * startY + 0.5 * ctrlY + 0.25 * endY;
          return (
            <g key={idx}>
              <path d={d} fill="none" stroke="#ffffff" strokeWidth="5.5" opacity="0.9" />
              <path
                d={d}
                fill="none"
                stroke={stroke}
                strokeWidth="2.6"
                strokeDasharray={dash}
                markerEnd={getMarker(e.label)}
              />
              <g transform={`translate(${midX}, ${labelY})`}>
                <rect
                  x="-12"
                  y="-9"
                  width="24"
                  height="17"
                  rx="4.5"
                  fill="#ffffff"
                  stroke={stroke}
                  strokeWidth="1.3"
                />
                <text
                  x="0"
                  y="3.5"
                  textAnchor="middle"
                  fill={stroke}
                  fontSize="10"
                  fontWeight="900"
                >
                  {e.label}
                </text>
              </g>
            </g>
          );
        }

        if (e.curve === 'bottom') {
          const startX = from.x;
          const startY = from.y + 21;
          const endX = to.x;
          const endY = to.y + 21;
          const midX = (startX + endX) / 2;
          const ctrlY = 202;
          const d = `M ${startX} ${startY} Q ${midX} ${ctrlY} ${endX} ${endY}`;
          const labelY = 0.25 * startY + 0.5 * ctrlY + 0.25 * endY;
          return (
            <g key={idx}>
              <path d={d} fill="none" stroke="#ffffff" strokeWidth="5.5" opacity="0.9" />
              <path
                d={d}
                fill="none"
                stroke={stroke}
                strokeWidth="2.6"
                strokeDasharray={dash}
                markerEnd={getMarker(e.label)}
              />
              <g transform={`translate(${midX}, ${labelY})`}>
                <rect
                  x="-12"
                  y="-9"
                  width="24"
                  height="17"
                  rx="4.5"
                  fill="#ffffff"
                  stroke={stroke}
                  strokeWidth="1.3"
                />
                <text
                  x="0"
                  y="3.5"
                  textAnchor="middle"
                  fill={stroke}
                  fontSize="10"
                  fontWeight="900"
                >
                  {e.label}
                </text>
              </g>
            </g>
          );
        }

        // Straight segment clipped cleanly to 38x38 mini station plaque
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const x1 = from.x + ux * 21;
        const y1 = from.y + uy * 21;
        const x2 = to.x - ux * 24;
        const y2 = to.y - uy * 24;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        return (
          <g key={idx}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#ffffff"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={stroke}
              strokeWidth="2.8"
              strokeDasharray={dash}
              markerEnd={getMarker(e.label)}
            />
            <rect
              x={midX - 11}
              y={midY - 20}
              width="22"
              height="16"
              rx="4.5"
              fill="#ffffff"
              stroke={stroke}
              strokeWidth="1.3"
            />
            <text
              x={midX}
              y={midY - 9}
              textAnchor="middle"
              fill={stroke}
              fontSize="10"
              fontWeight="900"
            >
              {e.label}
            </text>
          </g>
        );
      })}

      {/* Nodes with Official STC Metro Pictograms */}
      {card.nodes.map((n) => {
        const spec = getStationVisualSpec(n.id);
        return (
          <g key={n.id}>
            {n.isAccept && (
              <rect
                x={n.x - 23}
                y={n.y - 23}
                width="46"
                height="46"
                rx="11"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.2"
                strokeDasharray="4,2"
              />
            )}
            <rect
              x={n.x - 19}
              y={n.y - 19}
              width="38"
              height="38"
              rx="9"
              fill={spec.primaryColor}
              stroke="#0f172a"
              strokeWidth="2"
            />
            <g transform={`translate(${n.x}, ${n.y - 1}) scale(0.84)`}>
              <CdmxStationGlyphSvg
                glyphId={spec.glyphId}
                memberGlyphs={spec.memberGlyphs}
                color="#ffffff"
              />
            </g>
            {/* Mini state ID badge in bottom-right corner */}
            <rect
              x={n.x + 5}
              y={n.y + 5}
              width="15"
              height="14"
              rx="3.5"
              fill="#0f172a"
              stroke="#ffffff"
              strokeWidth="1"
            />
            <text
              x={n.x + 12.5}
              y={n.y + 14.5}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="8.5"
              fontWeight="900"
              fontFamily="monospace"
            >
              {n.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export const RegexLibrarySection: React.FC<RegexLibrarySectionProps> = ({
  selectedCardId,
  onSelectCard,
}) => {
  const [internalSelectedId, setInternalSelectedId] = useState<string>('exercise');
  const activeId = selectedCardId ?? internalSelectedId;
  const activeCard =
    REGEX_LIBRARY.find((c) => c.id === activeId) || REGEX_LIBRARY[0];

  const handleSelect = (id: string) => {
    setInternalSelectedId(id);
    onSelectCard?.(id);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {REGEX_LIBRARY.map((card) => {
          const isSelected = card.id === activeCard.id;
          return (
            <button
              key={card.id}
              onClick={() => handleSelect(card.id)}
              className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-orange-50/90 border-[#FF6B00] shadow-md ring-2 ring-[#FF6B00]/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono">
                  ER = {card.expression}
                </span>
                <span className="text-[10px] font-bold text-[#FF6B00]">
                  {card.tag}
                </span>
              </div>
              <div className="text-xs font-black text-slate-900 mb-2">
                {card.title}
              </div>
              <MiniRegexDiagram card={card} />
              <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                {card.metroAnalogy}
              </p>
            </button>
          );
        })}
      </div>

      {/* Detailed card breakdown */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#FF6B00] text-white text-[10px] font-black uppercase tracking-wider">
              Regla de Construcción de Thompson
            </span>
            <span className="text-xs font-mono text-orange-300 font-bold">
              {activeCard.title} ({activeCard.expression})
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {activeCard.diagramRule}
          </p>
        </div>
        <div className="shrink-0 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-[11px] text-emerald-300 font-mono">
          En <strong className="text-white">(ab)a*</strong>: A→B→C aplica{' '}
          <strong className="text-pink-400">Concatenación</strong> y C→D→E→F aplica{' '}
          <strong className="text-emerald-400">Cerradura a*</strong>
        </div>
      </div>
    </div>
  );
};
