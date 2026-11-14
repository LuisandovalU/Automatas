import React from 'react';
import { NFA_STATIONS, NfaState } from '../data/automataData';
import { CDMX_LINES, getStationVisualSpec } from '../data/cdmxLinesData';
import { CdmxStationGlyphSvg } from './CdmxStationGlyphSvg';

interface MetroMapNFAProps {
  activeStates?: NfaState[];
  highlightedTransitions?: string[];
  selectedStation?: NfaState | null;
  onSelectStation?: (state: NfaState) => void;
  showNewAccepts?: boolean;
  caption?: string;
}

export const MetroMapNFA: React.FC<MetroMapNFAProps> = ({
  activeStates = [],
  highlightedTransitions = [],
  selectedStation = null,
  onSelectStation,
  showNewAccepts = false,
  caption,
}) => {
  const isTransitionHot = (id: string) => highlightedTransitions.includes(id);

  const stationOrder: NfaState[] = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Red Original AFN-ε · Expresión (ab)a*
          </h3>
          {caption && <p className="text-xs text-slate-500 mt-0.5">{caption}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-5 h-0.5 bg-orange-600 inline-block" />
            <span>Tren pagado (a, b)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-5 h-0.5 border-t-2 border-dashed border-sky-600 inline-block" />
            <span>Pasillo gratis (ε)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded border-2 border-emerald-600 ring-2 ring-emerald-200 inline-block" />
            <span>Salida válida</span>
          </span>
        </div>
      </div>

      <div className="metro-grid-bg rounded-lg border border-slate-100 overflow-x-auto">
        <svg
          viewBox="0 0 920 330"
          className="w-full min-w-[680px] h-auto select-none"
          role="img"
          aria-label="Mapa tipo Metro CDMX del autómata AFN-épsilon"
        >
          <defs>
            <marker
              id="arrow-train"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#ea580c" />
            </marker>
            <marker
              id="arrow-train-hot"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#9a3412" />
            </marker>
            <marker
              id="arrow-walk"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
            </marker>
            <marker
              id="arrow-walk-hot"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#0369a1" />
            </marker>
            <marker
              id="arrow-start"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#334155" />
            </marker>
          </defs>

          {/* Inicio */}
          <g>
            <line
              x1="22"
              y1="180"
              x2="66"
              y2="180"
              stroke="#334155"
              strokeWidth="2.5"
              markerEnd="url(#arrow-start)"
            />
            <text x="20" y="166" className="fill-slate-700 text-[12px] font-semibold">
              Inicio
            </text>
          </g>

          {/* A -> B (a) */}
          <g>
            <line
              x1="130"
              y1="180"
              x2="212"
              y2="180"
              stroke={isTransitionHot('A-a-B') ? '#9a3412' : '#ea580c'}
              strokeWidth={isTransitionHot('A-a-B') ? 5 : 3.5}
              markerEnd={isTransitionHot('A-a-B') ? 'url(#arrow-train-hot)' : 'url(#arrow-train)'}
            />
            <rect x="148" y="146" width="46" height="22" rx="5" fill="#fff7ed" stroke="#fdba74" />
            <text x="171" y="161" textAnchor="middle" className="fill-orange-800 text-[11px] font-mono font-semibold">
              a · tren
            </text>
          </g>

          {/* B -> C (b) */}
          <g>
            <line
              x1="275"
              y1="180"
              x2="357"
              y2="180"
              stroke={isTransitionHot('B-b-C') ? '#9a3412' : '#ea580c'}
              strokeWidth={isTransitionHot('B-b-C') ? 5 : 3.5}
              markerEnd={isTransitionHot('B-b-C') ? 'url(#arrow-train-hot)' : 'url(#arrow-train)'}
            />
            <rect x="293" y="146" width="46" height="22" rx="5" fill="#fff7ed" stroke="#fdba74" />
            <text x="316" y="161" textAnchor="middle" className="fill-orange-800 text-[11px] font-mono font-semibold">
              b · tren
            </text>
          </g>

          {/* C -> D (ε) */}
          <g>
            <line
              x1="420"
              y1="180"
              x2="502"
              y2="180"
              stroke={isTransitionHot('C-e-D') ? '#0369a1' : '#0284c7'}
              strokeWidth={isTransitionHot('C-e-D') ? 4.5 : 3}
              strokeDasharray="6 4"
              markerEnd={isTransitionHot('C-e-D') ? 'url(#arrow-walk-hot)' : 'url(#arrow-walk)'}
            />
            <rect x="435" y="146" width="52" height="22" rx="5" fill="#f0f9ff" stroke="#7dd3fc" />
            <text x="461" y="161" textAnchor="middle" className="fill-sky-800 text-[11px] font-mono font-semibold">
              ε · gratis
            </text>
          </g>

          {/* D -> E (a) */}
          <g>
            <line
              x1="565"
              y1="180"
              x2="647"
              y2="180"
              stroke={isTransitionHot('D-a-E') ? '#9a3412' : '#ea580c'}
              strokeWidth={isTransitionHot('D-a-E') ? 5 : 3.5}
              markerEnd={isTransitionHot('D-a-E') ? 'url(#arrow-train-hot)' : 'url(#arrow-train)'}
            />
            <rect x="583" y="146" width="46" height="22" rx="5" fill="#fff7ed" stroke="#fdba74" />
            <text x="606" y="161" textAnchor="middle" className="fill-orange-800 text-[11px] font-mono font-semibold">
              a · tren
            </text>
          </g>

          {/* E -> F (ε) */}
          <g>
            <line
              x1="710"
              y1="180"
              x2="792"
              y2="180"
              stroke={isTransitionHot('E-e-F') ? '#0369a1' : '#0284c7'}
              strokeWidth={isTransitionHot('E-e-F') ? 4.5 : 3}
              strokeDasharray="6 4"
              markerEnd={isTransitionHot('E-e-F') ? 'url(#arrow-walk-hot)' : 'url(#arrow-walk)'}
            />
            <rect x="725" y="146" width="52" height="22" rx="5" fill="#f0f9ff" stroke="#7dd3fc" />
            <text x="751" y="161" textAnchor="middle" className="fill-sky-800 text-[11px] font-mono font-semibold">
              ε · salir
            </text>
          </g>

          {/* E -> D (ε top return loop) */}
          <g>
            <path
              d="M 680 148 C 680 72, 535 72, 535 144"
              fill="none"
              stroke={isTransitionHot('E-e-D') ? '#0369a1' : '#0284c7'}
              strokeWidth={isTransitionHot('E-e-D') ? 4.5 : 3}
              strokeDasharray="6 4"
              markerEnd={isTransitionHot('E-e-D') ? 'url(#arrow-walk-hot)' : 'url(#arrow-walk)'}
            />
            <rect x="594" y="65" width="28" height="20" rx="4" fill="#f0f9ff" stroke="#7dd3fc" />
            <text x="608" y="79" textAnchor="middle" className="fill-sky-800 text-[13px] font-mono font-semibold">
              ε
            </text>
            <text x="608" y="54" textAnchor="middle" className="fill-slate-500 text-[11px]">
              regresa por otra "a"
            </text>
          </g>

          {/* C -> F (ε bottom express bypass) */}
          <g>
            <path
              d="M 390 212 C 460 302, 755 302, 822 216"
              fill="none"
              stroke={isTransitionHot('C-e-F') ? '#0369a1' : '#0284c7'}
              strokeWidth={isTransitionHot('C-e-F') ? 4.5 : 3}
              strokeDasharray="6 4"
              markerEnd={isTransitionHot('C-e-F') ? 'url(#arrow-walk-hot)' : 'url(#arrow-walk)'}
            />
            <rect x="594" y="268" width="28" height="20" rx="4" fill="#f0f9ff" stroke="#7dd3fc" />
            <text x="608" y="282" textAnchor="middle" className="fill-sky-800 text-[13px] font-mono font-semibold">
              ε
            </text>
            <text x="608" y="304" textAnchor="middle" className="fill-slate-500 text-[11px]">
              atajo gratis sin "a"s extra
            </text>
          </g>

          {/* Stations with Official CDMX Metro Line Colors & Official Logos */}
          {stationOrder.map((id) => {
            const st = NFA_STATIONS[id];
            const spec = getStationVisualSpec(id);
            const isActive = activeStates.includes(id);
            const isSelected = selectedStation === id;
            const isAccept = showNewAccepts ? st.isNewAccept : Boolean(st.isOriginalAccept);
            const sliceW = 54 / Math.max(1, spec.lines.length);
            const clipId = `nfa-clip-${id}`;

            return (
              <g
                key={id}
                transform={`translate(${st.x}, ${st.y})`}
                onClick={() => onSelectStation?.(id)}
                className={onSelectStation ? 'cursor-pointer' : undefined}
              >
                <defs>
                  <clipPath id={clipId}>
                    <rect x="-27" y="-27" width="54" height="54" rx="11" />
                  </clipPath>
                </defs>

                {/* Selection / Active outer highlight */}
                {(isActive || isSelected) && (
                  <rect
                    x="-39"
                    y="-39"
                    width="78"
                    height="78"
                    rx="17"
                    fill="none"
                    stroke={isActive ? '#ea580c' : '#0284c7'}
                    strokeWidth="3"
                    opacity="0.95"
                  />
                )}

                {/* Accepting double ring */}
                {isAccept && (
                  <rect
                    x="-33"
                    y="-33"
                    width="66"
                    height="66"
                    rx="14"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2.5"
                  />
                )}

                {/* Main Metro CDMX multi-line color tile */}
                <g clipPath={`url(#${clipId})`}>
                  {spec.lines.map((lineCode, idx) => (
                    <rect
                      key={lineCode}
                      x={-27 + idx * sliceW}
                      y="-27"
                      width={sliceW + 0.8}
                      height="54"
                      fill={CDMX_LINES[lineCode].color}
                    />
                  ))}
                  <rect x="-27" y="-27" width="54" height="54" fill="#0f172a" opacity="0.22" />
                </g>

                <rect
                  x="-27"
                  y="-27"
                  width="54"
                  height="54"
                  rx="11"
                  fill="none"
                  stroke={isActive ? '#0f172a' : isAccept ? '#059669' : '#1e293b'}
                  strokeWidth={isActive ? 3 : 2}
                />

                {/* Official Station Pictogram */}
                <g transform="translate(0, -1) scale(0.95)">
                  <CdmxStationGlyphSvg glyphId={spec.glyphId} color="#ffffff" />
                </g>

                {/* State ID Corner Badge (A..F) */}
                <g transform="translate(21, -21)">
                  <circle r="10" fill="#0f172a" stroke="#ffffff" strokeWidth="1.8" />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    className="fill-white text-[11px] font-mono font-bold"
                  >
                    {id}
                  </text>
                </g>

                {/* Station Metro Name */}
                <text
                  x="0"
                  y="44"
                  textAnchor="middle"
                  className="fill-slate-800 text-[11px] font-bold"
                >
                  {st.metroName}
                </text>

                {/* Official Line Number Badges row */}
                <g transform={`translate(${-((spec.lines.length * 16 - 2) / 2)}, 50)`}>
                  {spec.lines.map((lineCode, idx) => {
                    const info = CDMX_LINES[lineCode];
                    return (
                      <g key={lineCode} transform={`translate(${idx * 16}, 0)`}>
                        <rect width="14" height="14" rx="3" fill={info.color} />
                        <text
                          x="7"
                          y="10.5"
                          textAnchor="middle"
                          fill={info.textColor}
                          className="text-[9px] font-bold"
                        >
                          {info.code}
                        </text>
                      </g>
                    );
                  })}
                </g>

                {isActive && (
                  <g transform="translate(0, -47)">
                    <rect x="-26" y="-10" width="52" height="18" rx="4" fill="#0f172a" />
                    <text x="0" y="3" textAnchor="middle" className="fill-white text-[10px] font-semibold">
                      AQUÍ
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
