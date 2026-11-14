import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Layers } from 'lucide-react';
import { REGEX_LIBRARY, RegexPatternGuide, RegexPatternId } from '../data/regexLibraryData';
import { metroAudio } from '../utils/metroAudio';

const MiniRegexDiagram: React.FC<{ pattern: RegexPatternGuide }> = ({ pattern }) => {
  const nodeMap = Object.fromEntries(pattern.nodes.map((n) => [n.id, n]));

  return (
    <div className="metro-grid-bg rounded-lg border border-slate-200 overflow-x-auto">
      <svg
        viewBox="0 0 530 230"
        className="w-full min-w-[440px] h-auto select-none"
        role="img"
        aria-label={`Diagrama de ${pattern.expression}`}
      >
        <defs>
          <marker id="lib-arrow-train" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#ea580c" />
          </marker>
          <marker id="lib-arrow-walk" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
          </marker>
          <marker id="lib-arrow-start" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#334155" />
          </marker>
        </defs>

        {/* Start arrow */}
        {pattern.nodes
          .filter((n) => n.isStart)
          .map((n) => (
            <g key={`start-${n.id}`}>
              <line
                x1={Math.max(8, n.x - 48)}
                y1={n.y}
                x2={n.x - 23}
                y2={n.y}
                stroke="#334155"
                strokeWidth="2"
                markerEnd="url(#lib-arrow-start)"
              />
            </g>
          ))}

        {/* Edges */}
        {pattern.edges.map((edge, idx) => {
          const from = nodeMap[edge.from];
          const to = nodeMap[edge.to];
          const isWalk = edge.kind === 'walk';
          const color = isWalk ? '#0284c7' : '#ea580c';
          const marker = isWalk ? 'url(#lib-arrow-walk)' : 'url(#lib-arrow-train)';

          if (edge.curve === 'top') {
            const mx = (from.x + to.x) / 2;
            return (
              <g key={idx}>
                <path
                  d={`M ${from.x} ${from.y - 20} C ${from.x} ${from.y - 82}, ${to.x} ${to.y - 82}, ${to.x} ${to.y - 23}`}
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                  strokeDasharray={isWalk ? '5 4' : undefined}
                  markerEnd={marker}
                />
                <rect x={mx - 11} y={from.y - 78} width="22" height="18" rx="4" fill="#f0f9ff" stroke="#7dd3fc" />
                <text x={mx} y={from.y - 65} textAnchor="middle" className="fill-sky-800 text-[12px] font-mono font-semibold">
                  {edge.label}
                </text>
              </g>
            );
          }

          if (edge.curve === 'bottom') {
            const mx = (from.x + to.x) / 2;
            return (
              <g key={idx}>
                <path
                  d={`M ${from.x} ${from.y + 20} C ${from.x + 30} ${from.y + 92}, ${to.x - 30} ${to.y + 92}, ${to.x} ${to.y + 23}`}
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                  strokeDasharray={isWalk ? '5 4' : undefined}
                  markerEnd={marker}
                />
                <rect x={mx - 11} y={from.y + 62} width="22" height="18" rx="4" fill="#f0f9ff" stroke="#7dd3fc" />
                <text x={mx} y={from.y + 75} textAnchor="middle" className="fill-sky-800 text-[12px] font-mono font-semibold">
                  {edge.label}
                </text>
              </g>
            );
          }

          // Straight or diagonal
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const x1 = from.x + ux * 20;
          const y1 = from.y + uy * 20;
          const x2 = to.x - ux * 23;
          const y2 = to.y - uy * 23;
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2 - 12;

          return (
            <g key={idx}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth="2.5"
                strokeDasharray={isWalk ? '5 4' : undefined}
                markerEnd={marker}
              />
              <rect
                x={mx - 10}
                y={my - 9}
                width="20"
                height="18"
                rx="4"
                fill={isWalk ? '#f0f9ff' : '#fff7ed'}
                stroke={isWalk ? '#7dd3fc' : '#fdba74'}
              />
              <text
                x={mx}
                y={my + 4}
                textAnchor="middle"
                className={`text-[12px] font-mono font-semibold ${isWalk ? 'fill-sky-800' : 'fill-orange-800'}`}
              >
                {edge.label}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {pattern.nodes.map((node) => (
          <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
            {node.isAccept && (
              <rect
                x="-23"
                y="-23"
                width="46"
                height="46"
                rx="11"
                fill="none"
                stroke="#059669"
                strokeWidth="2"
              />
            )}
            <rect
              x="-18"
              y="-18"
              width="36"
              height="36"
              rx="8"
              fill={node.isAccept ? '#ecfdf5' : '#ffffff'}
              stroke={node.isAccept ? '#059669' : '#1e293b'}
              strokeWidth="2"
            />
            <text
              x="0"
              y="5"
              textAnchor="middle"
              className={`font-display text-[15px] font-bold ${
                node.isAccept ? 'fill-emerald-900' : 'fill-slate-900'
              }`}
            >
              {node.id}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export const RegexLibrarySection: React.FC = () => {
  const [selectedId, setSelectedId] = useState<RegexPatternId>('exercise');
  const [flowStep, setFlowStep] = useState<1 | 2 | 3>(1);

  const active = REGEX_LIBRARY.find((p) => p.id === selectedId)!;

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-orange-600" />
            <span>Paso 0 · Biblioteca de Expresiones Regulares</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 text-balance">
            ¿Cómo saber qué diagrama dibujar según el tipo de expresión regular?
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Antes de llenar tablas, aprende a diferenciar los 5 bloques base y cómo se traducen primero a un mapa con
            pasillos <span className="font-mono font-semibold">ε</span> y después a una tabla.
          </p>
        </div>

        {/* 3-Step Pipeline Indicator */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg self-start shrink-0">
          {[
            { step: 1 as const, label: '1. Leer ER' },
            { step: 2 as const, label: '2. Dibujar Mapa' },
            { step: 3 as const, label: '3. Pasar a Tabla' },
          ].map((item) => (
            <button
              key={item.step}
              onClick={() => {
                setFlowStep(item.step);
                metroAudio.playTicketClick();
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                flowStep === item.step
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pattern Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {REGEX_LIBRARY.map((item) => {
          const isCurrent = item.id === selectedId;
          return (
            <button
              key={item.id}
              onClick={() => {
                setSelectedId(item.id);
                metroAudio.playTicketClick();
              }}
              className={`text-left p-3 rounded-lg border transition-colors ${
                isCurrent
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-orange-50 hover:border-orange-200'
              }`}
            >
              <div className={`text-[11px] ${isCurrent ? 'text-orange-300' : 'text-slate-500'}`}>
                {item.tag}
              </div>
              <div className="font-mono text-base font-bold mt-0.5">{item.expression}</div>
              <div className={`text-xs mt-0.5 truncate ${isCurrent ? 'text-slate-200' : 'text-slate-600'}`}>
                {item.title.split('(')[0].trim()}
              </div>
            </button>
          );
        })}
      </div>

      {/* Visual ER -> Diagram -> Table Pipeline with Arrows */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Step 1: How to spot and differentiate */}
        <div
          className={`lg:col-span-4 rounded-xl border p-4 space-y-3 transition-colors ${
            flowStep === 1 ? 'border-orange-400 bg-orange-50/40' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-orange-800">Paso 1 · Cómo reconocer la ER</span>
            <ArrowRight className="w-4 h-4 text-slate-400 hidden lg:block" />
          </div>
          <div>
            <div className="font-mono text-2xl font-bold text-slate-900">{active.expression}</div>
            <div className="text-sm font-semibold text-slate-800 mt-0.5">{active.title}</div>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            <strong className="text-slate-900">Pista visual:</strong> {active.howToSpot}
          </p>
          <p className="text-xs text-slate-700 leading-relaxed">
            <strong className="text-slate-900">En el Metro:</strong> {active.metroAnalogy}
          </p>
          <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700">
            <span className="font-semibold text-slate-900">Diferencia clave: </span>
            {active.differenceHighlight}
          </div>
          <div className="flex flex-wrap gap-3 pt-1 text-xs">
            <div>
              <span className="font-semibold text-emerald-800">Acepta: </span>
              <span className="font-mono text-slate-800">{active.validExamples.join(', ')}</span>
            </div>
            <div>
              <span className="font-semibold text-rose-800">Rechaza: </span>
              <span className="font-mono text-slate-800">{active.invalidExamples.join(', ')}</span>
            </div>
          </div>
        </div>

        {/* Step 2: Diagram */}
        <div
          className={`lg:col-span-5 rounded-xl border p-4 space-y-3 transition-colors ${
            flowStep === 2 ? 'border-orange-400 bg-orange-50/40' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-800">Paso 2 · De ER a Diagrama AFN-ε</span>
            <ArrowRight className="w-4 h-4 text-slate-400 hidden lg:block" />
          </div>
          <MiniRegexDiagram pattern={active} />
          <p className="text-xs text-slate-700 leading-relaxed">
            <strong className="text-slate-900">Regla de dibujo:</strong> {active.diagramRule}
          </p>
        </div>

        {/* Step 3: Table */}
        <div
          className={`lg:col-span-3 rounded-xl border p-4 space-y-3 transition-colors ${
            flowStep === 3 ? 'border-orange-400 bg-orange-50/40' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Paso 3 · De Diagrama a Tabla</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
            <table className="w-full text-left border-collapse text-xs tabular-nums font-mono">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-sans">
                  <th className="py-1.5 px-2 font-semibold">Edo</th>
                  <th className="py-1.5 px-2 font-semibold">a</th>
                  <th className="py-1.5 px-2 font-semibold">b</th>
                  <th className="py-1.5 px-2 font-semibold text-sky-700">ε</th>
                  <th className="py-1.5 px-2 font-semibold">EF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {active.tableRows.map((r) => (
                  <tr key={r.state}>
                    <td className="py-1.5 px-2 font-semibold text-slate-900">{r.state}</td>
                    <td className="py-1.5 px-2 text-orange-800">{r.onA}</td>
                    <td className="py-1.5 px-2 text-orange-800">{r.onB}</td>
                    <td className="py-1.5 px-2 text-sky-700">{r.onEps}</td>
                    <td className={`py-1.5 px-2 font-semibold ${r.ef.includes('1') ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {r.ef}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            <strong className="text-slate-900">Cómo leerla:</strong> {active.tableRule}
          </p>
        </div>
      </div>
    </section>
  );
};
