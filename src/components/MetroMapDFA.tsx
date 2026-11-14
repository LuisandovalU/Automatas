import React from 'react';
import { DFA_ORDER, DFA_STATIONS, DfaStateId } from '../data/automataData';
import { CDMX_LINES, getStationVisualSpec } from '../data/cdmxLinesData';
import { DEFAULT_EXERCISE_BUNDLE, SolvedMethodBundle } from '../engine/automataMethodEngine';
import { CdmxStationGlyphSvg } from './CdmxStationGlyphSvg';

interface MetroMapDFAProps {
  bundle?: SolvedMethodBundle;
  activeState?: string | null;
  highlightedEdge?: string | null;
  onSelectState?: (state: string) => void;
  caption?: string;
}

function getCardSize(id: string): { w: number; h: number } {
  const w = Math.max(92, Math.min(184, id.length * 10 + 48));
  return { w, h: 62 };
}

function getBoxBoundaryPoint(
  cx: number,
  cy: number,
  targetX: number,
  targetY: number,
  hw: number,
  hh: number
): { x: number; y: number } {
  const dx = targetX - cx;
  const dy = targetY - cy;
  if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) return { x: cx, y: cy };
  const tx = Math.abs(dx) > 1e-4 ? hw / Math.abs(dx) : Infinity;
  const ty = Math.abs(dy) > 1e-4 ? hh / Math.abs(dy) : Infinity;
  const t = Math.min(tx, ty);
  return { x: cx + dx * t, y: cy + dy * t };
}

export const MetroMapDFA: React.FC<MetroMapDFAProps> = ({
  bundle = DEFAULT_EXERCISE_BUNDLE,
  activeState = null,
  highlightedEdge = null,
  onSelectState,
  caption,
}) => {
  // Preserve exact handcrafted Slide 4 diagram for Exercise A2 (ab)a*
  if (bundle.spec.id === 'a2-ab-astar') {
    const isHot = (edgeId: string) => {
      if (!highlightedEdge) return false;
      if (highlightedEdge === edgeId) return true;
      const parts = highlightedEdge.split('-');
      if (parts.length === 3 && edgeId.startsWith(`${parts[0]}-`) && edgeId.endsWith(`-${parts[2]}`)) {
        return true;
      }
      return false;
    };

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Red Final AFD · Sin pasillos invisibles (Determinista)
            </h3>
            {caption && <p className="text-xs text-slate-500 mt-0.5">{caption}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-5 h-0.5 bg-orange-600 inline-block" />
              <span>Vía válida</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-5 h-0.5 bg-rose-500 inline-block" />
              <span>Desvío a Vía Muerta [∅]</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-600 ring-2 ring-emerald-200 inline-block" />
              <span>Salida válida (EF = 1)</span>
            </span>
          </div>
        </div>

        <div className="metro-grid-bg rounded-lg border border-slate-100 overflow-x-auto">
          <svg
            viewBox="0 0 900 470"
            className="w-full min-w-[660px] h-auto select-none"
            role="img"
            aria-label="Mapa tipo Metro CDMX del autómata determinista AFD final"
          >
            <defs>
              <marker id="dfa-arrow-orange" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#ea580c" />
              </marker>
              <marker id="dfa-arrow-hot" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#9a3412" />
              </marker>
              <marker id="dfa-arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" />
              </marker>
              <marker id="dfa-arrow-start" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#334155" />
              </marker>
            </defs>

            {/* Inicio -> [A] */}
            <g>
              <line x1="285" y1="110" x2="372" y2="110" stroke="#334155" strokeWidth="2.5" markerEnd="url(#dfa-arrow-start)" />
              <text x="285" y="96" className="fill-slate-700 text-[12px] font-semibold">Inicio</text>
            </g>

            {/* [A] --a--> [B] */}
            <g>
              <line x1="464" y1="110" x2="650" y2="110" stroke={isHot('[A]-a-[B]') ? '#9a3412' : '#ea580c'} strokeWidth={isHot('[A]-a-[B]') ? 5 : 3.5} markerEnd={isHot('[A]-a-[B]') ? 'url(#dfa-arrow-hot)' : 'url(#dfa-arrow-orange)'} />
              <rect x="536" y="83" width="44" height="22" rx="5" fill="#fff7ed" stroke="#fdba74" />
              <text x="558" y="98" textAnchor="middle" className="fill-orange-800 text-[11px] font-mono font-semibold">a · vía</text>
            </g>

            {/* [A] --b--> [∅] */}
            <g>
              <line x1="444" y1="138" x2="531" y2="225" stroke={isHot('[A]-b-[∅]') ? '#9f1239' : '#e11d48'} strokeWidth={isHot('[A]-b-[∅]') ? 4.5 : 2.5} markerEnd="url(#dfa-arrow-red)" />
              <rect x="462" y="176" width="22" height="20" rx="4" fill="#fff1f2" stroke="#fda4af" />
              <text x="473" y="190" textAnchor="middle" className="fill-rose-800 text-[12px] font-mono font-semibold">b</text>
            </g>

            {/* [B] --a--> [∅] */}
            <g>
              <line x1="674" y1="138" x2="588" y2="225" stroke={isHot('[B]-a-[∅]') ? '#9f1239' : '#e11d48'} strokeWidth={isHot('[B]-a-[∅]') ? 4.5 : 2.5} markerEnd="url(#dfa-arrow-red)" />
              <rect x="634" y="176" width="22" height="20" rx="4" fill="#fff1f2" stroke="#fda4af" />
              <text x="645" y="190" textAnchor="middle" className="fill-rose-800 text-[12px] font-mono font-semibold">a</text>
            </g>

            {/* [B] --b--> [C,D,F] */}
            <g>
              <line x1="710" y1="145" x2="736" y2="334" stroke={isHot('[B]-b-[C,D,F]') ? '#9a3412' : '#ea580c'} strokeWidth={isHot('[B]-b-[C,D,F]') ? 5 : 3.5} markerEnd={isHot('[B]-b-[C,D,F]') ? 'url(#dfa-arrow-hot)' : 'url(#dfa-arrow-orange)'} />
              <rect x="725" y="232" width="44" height="22" rx="5" fill="#fff7ed" stroke="#fdba74" />
              <text x="747" y="247" textAnchor="middle" className="fill-orange-800 text-[11px] font-mono font-semibold">b · vía</text>
            </g>

            {/* [C,D,F] --a--> [E,D,F] */}
            <g>
              <line x1="676" y1="380" x2="412" y2="380" stroke={isHot('[C,D,F]-a-[E,D,F]') ? '#9a3412' : '#ea580c'} strokeWidth={isHot('[C,D,F]-a-[E,D,F]') ? 5 : 3.5} markerEnd={isHot('[C,D,F]-a-[E,D,F]') ? 'url(#dfa-arrow-hot)' : 'url(#dfa-arrow-orange)'} />
              <rect x="514" y="392" width="58" height="22" rx="5" fill="#fff7ed" stroke="#fdba74" />
              <text x="543" y="407" textAnchor="middle" className="fill-orange-800 text-[11px] font-mono font-semibold">a · bucle</text>
            </g>

            {/* [C,D,F] --b--> [∅] */}
            <g>
              <line x1="696" y1="348" x2="594" y2="278" stroke={isHot('[C,D,F]-b-[∅]') ? '#9f1239' : '#e11d48'} strokeWidth={isHot('[C,D,F]-b-[∅]') ? 4.5 : 2.5} markerEnd="url(#dfa-arrow-red)" />
              <rect x="652" y="302" width="22" height="20" rx="4" fill="#fff1f2" stroke="#fda4af" />
              <text x="663" y="316" textAnchor="middle" className="fill-rose-800 text-[12px] font-mono font-semibold">b</text>
            </g>

            {/* [E,D,F] --b--> [∅] */}
            <g>
              <line x1="392" y1="348" x2="524" y2="275" stroke={isHot('[E,D,F]-b-[∅]') ? '#9f1239' : '#e11d48'} strokeWidth={isHot('[E,D,F]-b-[∅]') ? 4.5 : 2.5} markerEnd="url(#dfa-arrow-red)" />
              <rect x="430" y="294" width="22" height="20" rx="4" fill="#fff1f2" stroke="#fda4af" />
              <text x="441" y="308" textAnchor="middle" className="fill-rose-800 text-[12px] font-mono font-semibold">b</text>
            </g>

            {/* [E,D,F] --a--> [E,D,F] self loop */}
            <g>
              <path d="M 284 360 C 200 320, 200 440, 280 400" fill="none" stroke={isHot('[E,D,F]-a-[E,D,F]') ? '#9a3412' : '#ea580c'} strokeWidth={isHot('[E,D,F]-a-[E,D,F]') ? 5 : 3.5} markerEnd={isHot('[E,D,F]-a-[E,D,F]') ? 'url(#dfa-arrow-hot)' : 'url(#dfa-arrow-orange)'} />
              <rect x="180" y="370" width="24" height="20" rx="4" fill="#fff7ed" stroke="#fdba74" />
              <text x="192" y="384" textAnchor="middle" className="fill-orange-800 text-[12px] font-mono font-semibold">a</text>
              <text x="166" y="405" textAnchor="middle" className="fill-slate-500 text-[11px]">bucle a*</text>
            </g>

            {/* [∅] --a,b--> [∅] self loop */}
            <g>
              <path d="M 594 236 C 655 208, 655 292, 598 268" fill="none" stroke={isHot('[∅]-a-[∅]') || isHot('[∅]-b-[∅]') ? '#9f1239' : '#e11d48'} strokeWidth={isHot('[∅]-a-[∅]') || isHot('[∅]-b-[∅]') ? 4.5 : 2.5} markerEnd="url(#dfa-arrow-red)" />
              <rect x="646" y="242" width="34" height="20" rx="4" fill="#fff1f2" stroke="#fda4af" />
              <text x="663" y="256" textAnchor="middle" className="fill-rose-800 text-[12px] font-mono font-semibold">a, b</text>
            </g>

            {/* Nodes */}
            {DFA_ORDER.map((id) => {
              const st = DFA_STATIONS[id];
              const spec = getStationVisualSpec(id);
              const isActive = activeState === id;
              const isAccept = st.ef === '1';
              const isWide = id.length > 3;
              const w = isWide ? 142 : 94;
              const h = 64;
              const colors = spec.lines.length > 0 ? spec.lines.map((l) => CDMX_LINES[l].color) : ['#E11D48', '#334155'];
              const sliceW = w / colors.length;
              const clipId = `dfa-clip-${id.replace(/[^a-zA-Z0-9]/g, '')}`;

              return (
                <g key={id} transform={`translate(${st.x}, ${st.y})`} onClick={() => onSelectState?.(id as DfaStateId)} className={onSelectState ? 'cursor-pointer' : undefined}>
                  <defs>
                    <clipPath id={clipId}>
                      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx="14" />
                    </clipPath>
                  </defs>
                  {isActive && <rect x={-w / 2 - 9} y={-h / 2 - 9} width={w + 18} height={h + 18} rx="20" fill="none" stroke="#ea580c" strokeWidth="3" />}
                  {isAccept && <rect x={-w / 2 - 5} y={-h / 2 - 5} width={w + 10} height={h + 10} rx="17" fill="none" stroke="#059669" strokeWidth="2.5" />}
                  <g clipPath={`url(#${clipId})`}>
                    {colors.map((col, idx) => (
                      <rect key={`${id}-c-${idx}`} x={-w / 2 + idx * sliceW} y={-h / 2} width={sliceW + 1} height={h} fill={col} />
                    ))}
                    <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#0f172a" opacity="0.34" />
                  </g>
                  <rect x={-w / 2} y={-h / 2} width={w} height={h} rx="14" fill="none" stroke={isActive ? '#0f172a' : isAccept ? '#059669' : '#1e293b'} strokeWidth={isActive ? 3 : 2} />
                  <g transform={`translate(${-w / 2 + 24}, 0) scale(0.88)`}>
                    <CdmxStationGlyphSvg glyphId={spec.glyphId} color="#ffffff" />
                  </g>
                  <text x={14} y={-4} textAnchor="middle" className="font-mono text-[14px] font-bold fill-white">{id}</text>
                  {spec.lines.length > 0 ? (
                    <g transform={`translate(${14 - (spec.lines.length * 14 - 2) / 2}, 8)`}>
                      {spec.lines.map((lineCode, idx) => {
                        const info = CDMX_LINES[lineCode];
                        return (
                          <g key={lineCode} transform={`translate(${idx * 14}, 0)`}>
                            <rect width="12" height="12" rx="2.5" fill={info.color} stroke="#ffffff" strokeWidth="0.8" />
                            <text x="6" y="9" textAnchor="middle" fill={info.textColor} className="text-[8px] font-bold">{info.code}</text>
                          </g>
                        );
                      })}
                    </g>
                  ) : (
                    <text x={14} y={16} textAnchor="middle" className="fill-rose-200 text-[9px] font-semibold">SIN SALIDA</text>
                  )}
                  {isActive && (
                    <g transform={`translate(0, ${-h / 2 - 18})`}>
                      <rect x="-34" y="-10" width="68" height="18" rx="4" fill="#0f172a" />
                      <text x="0" y="3" textAnchor="middle" className="fill-white text-[10px] font-semibold">TREN AQUÍ</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  }

  // Dynamic AFD diagram renderer for ANY exercise
  const { width, height, nodes, edges } = bundle.dfaLayout;
  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Red Final AFD · {bundle.spec.regex ?? bundle.spec.title} (Determinista)
          </h3>
          {caption && <p className="text-xs text-slate-500 mt-0.5">{caption}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-5 h-0.5 bg-orange-600 inline-block" />
            <span>Vía válida</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-5 h-0.5 bg-rose-500 inline-block" />
            <span>Desvío a Vía Muerta [∅]</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-600 ring-2 ring-emerald-200 inline-block" />
            <span>Salida válida (EF = 1)</span>
          </span>
        </div>
      </div>

      <div className="metro-grid-bg rounded-lg border border-slate-100 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[660px] h-auto select-none"
          role="img"
          aria-label={`Diagrama AFD final de ${bundle.spec.title}`}
        >
          <defs>
            <marker id="dyn-dfa-orange" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#ea580c" />
            </marker>
            <marker id="dyn-dfa-hot" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#9a3412" />
            </marker>
            <marker id="dyn-dfa-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" />
            </marker>
            <marker id="dyn-dfa-start" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#334155" />
            </marker>
          </defs>

          {/* Start arrow */}
          {nodes
            .filter((n) => n.isStart)
            .map((n) => {
              const { w } = getCardSize(n.id);
              const startX = Math.max(10, n.x - w / 2 - 58);
              return (
                <g key={`start-${n.id}`}>
                  <line
                    x1={startX}
                    y1={n.y}
                    x2={n.x - w / 2 - 8}
                    y2={n.y}
                    stroke="#334155"
                    strokeWidth="2.5"
                    markerEnd="url(#dyn-dfa-start)"
                  />
                  <text x={startX} y={n.y - 11} className="fill-slate-700 text-[11px] font-semibold">
                    Inicio
                  </text>
                </g>
              );
            })}

          {/* Dynamic DFA Edges */}
          {edges.map((edge) => {
            const pFrom = nodeById[edge.from];
            const pTo = nodeById[edge.to];
            if (!pFrom || !pTo) return null;

            const isDead = edge.kind === 'dead';
            const hot = highlightedEdge === edge.id;
            const stroke = isDead ? (hot ? '#9f1239' : '#e11d48') : hot ? '#9a3412' : '#ea580c';
            const marker = isDead
              ? 'url(#dyn-dfa-red)'
              : hot
              ? 'url(#dyn-dfa-hot)'
              : 'url(#dyn-dfa-orange)';

            const fromSize = getCardSize(edge.from);
            const toSize = getCardSize(edge.to);

            if (edge.from === edge.to) {
              const loopRight = pFrom.y > height * 0.65;
              const pathD = loopRight
                ? `M ${pFrom.x + fromSize.w / 2} ${pFrom.y - 16} C ${pFrom.x + fromSize.w / 2 + 65} ${pFrom.y - 38}, ${pFrom.x + fromSize.w / 2 + 65} ${pFrom.y + 38}, ${pFrom.x + fromSize.w / 2 + 6} ${pFrom.y + 16}`
                : `M ${pFrom.x - 18} ${pFrom.y - fromSize.h / 2} C ${pFrom.x - 44} ${pFrom.y - fromSize.h / 2 - 64}, ${pFrom.x + 44} ${pFrom.y - fromSize.h / 2 - 64}, ${pFrom.x + 18} ${pFrom.y - fromSize.h / 2 - 6}`;
              const lx = loopRight ? pFrom.x + fromSize.w / 2 + 48 : pFrom.x;
              const ly = loopRight ? pFrom.y : pFrom.y - fromSize.h / 2 - 48;
              const lblW = Math.max(24, edge.label.length * 8 + 12);

              return (
                <g key={edge.id}>
                  <path d={pathD} fill="none" stroke={stroke} strokeWidth={hot ? 4.5 : 2.8} markerEnd={marker} />
                  <rect
                    x={lx - lblW / 2}
                    y={ly - 10}
                    width={lblW}
                    height="20"
                    rx="4"
                    fill={isDead ? '#fff1f2' : '#fff7ed'}
                    stroke={isDead ? '#fda4af' : '#fdba74'}
                  />
                  <text
                    x={lx}
                    y={ly + 4}
                    textAnchor="middle"
                    className={`text-[11px] font-mono font-semibold ${isDead ? 'fill-rose-800' : 'fill-orange-800'}`}
                  >
                    {edge.label}
                  </text>
                </g>
              );
            }

            const dx = pTo.x - pFrom.x;
            const dy = pTo.y - pFrom.y;
            const dist = Math.hypot(dx, dy) || 1;
            const nx = -dy / dist;
            const ny = dx / dist;
            const offset = edge.curveOffset ?? 0;

            const mx = (pFrom.x + pTo.x) / 2 + nx * offset;
            const my = (pFrom.y + pTo.y) / 2 + ny * offset;

            const startPt = getBoxBoundaryPoint(
              pFrom.x,
              pFrom.y,
              mx,
              my,
              fromSize.w / 2 + 2,
              fromSize.h / 2 + 2
            );
            const endPt = getBoxBoundaryPoint(
              pTo.x,
              pTo.y,
              mx,
              my,
              toSize.w / 2 + 7,
              toSize.h / 2 + 7
            );

            const lx = 0.25 * startPt.x + 0.5 * mx + 0.25 * endPt.x;
            const ly = 0.25 * startPt.y + 0.5 * my + 0.25 * endPt.y;
            const lblW = Math.max(24, edge.label.length * 8 + 12);

            return (
              <g key={edge.id}>
                <path
                  d={`M ${startPt.x} ${startPt.y} Q ${mx} ${my} ${endPt.x} ${endPt.y}`}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={hot ? 4.5 : isDead ? 2.4 : 3.2}
                  markerEnd={marker}
                />
                <rect
                  x={lx - lblW / 2}
                  y={ly - 10}
                  width={lblW}
                  height="20"
                  rx="4"
                  fill={isDead ? '#fff1f2' : '#fff7ed'}
                  stroke={isDead ? '#fda4af' : '#fdba74'}
                />
                <text
                  x={lx}
                  y={ly + 4}
                  textAnchor="middle"
                  className={`text-[11px] font-mono font-semibold ${isDead ? 'fill-rose-800' : 'fill-orange-800'}`}
                >
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Dynamic DFA Nodes */}
          {nodes.map((node) => {
            const spec = getStationVisualSpec(node.id);
            const isActive = activeState === node.id;
            const isAccept = node.isAccept;
            const { w, h } = getCardSize(node.id);
            const colors =
              spec.lines.length > 0 ? spec.lines.map((l) => CDMX_LINES[l].color) : ['#E11D48', '#334155'];
            const sliceW = w / colors.length;
            const clipId = `dyn-dfa-clip-${node.id.replace(/[^a-zA-Z0-9]/g, '')}`;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => onSelectState?.(node.id)}
                className={onSelectState ? 'cursor-pointer' : undefined}
              >
                <defs>
                  <clipPath id={clipId}>
                    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx="14" />
                  </clipPath>
                </defs>

                {isActive && (
                  <rect
                    x={-w / 2 - 9}
                    y={-h / 2 - 9}
                    width={w + 18}
                    height={h + 18}
                    rx="20"
                    fill="none"
                    stroke="#ea580c"
                    strokeWidth="3"
                  />
                )}

                {isAccept && (
                  <rect
                    x={-w / 2 - 5}
                    y={-h / 2 - 5}
                    width={w + 10}
                    height={h + 10}
                    rx="17"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2.5"
                  />
                )}

                <g clipPath={`url(#${clipId})`}>
                  {colors.map((col, idx) => (
                    <rect
                      key={`${node.id}-c-${idx}`}
                      x={-w / 2 + idx * sliceW}
                      y={-h / 2}
                      width={sliceW + 1}
                      height={h}
                      fill={col}
                    />
                  ))}
                  <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#0f172a" opacity="0.38" />
                </g>

                <rect
                  x={-w / 2}
                  y={-h / 2}
                  width={w}
                  height={h}
                  rx="14"
                  fill="none"
                  stroke={isActive ? '#0f172a' : isAccept ? '#059669' : '#1e293b'}
                  strokeWidth={isActive ? 3 : 2}
                />

                <text x={0} y={-2} textAnchor="middle" className="font-mono text-[13px] font-bold fill-white">
                  {node.id}
                </text>

                <text
                  x={0}
                  y={16}
                  textAnchor="middle"
                  className={`text-[9px] font-semibold ${node.isDeadEnd ? 'fill-rose-200' : isAccept ? 'fill-emerald-200' : 'fill-slate-200'}`}
                >
                  {node.isDeadEnd ? 'VÍA MUERTA' : isAccept ? 'EF = 1 · SALIDA' : 'EF = ∅'}
                </text>

                {isActive && (
                  <g transform={`translate(0, ${-h / 2 - 18})`}>
                    <rect x="-34" y="-10" width="68" height="18" rx="4" fill="#0f172a" />
                    <text x="0" y="3" textAnchor="middle" className="fill-white text-[10px] font-semibold">
                      TREN AQUÍ
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
