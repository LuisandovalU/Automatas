import React from 'react';
import { StationVisualSpec } from '../data/cdmxLinesData';

interface CdmxStationGlyphSvgProps {
  glyphId: StationVisualSpec['glyphId'];
  color?: string;
}

export const CdmxStationGlyphSvg: React.FC<CdmxStationGlyphSvgProps> = ({
  glyphId,
  color = '#ffffff',
}) => {
  switch (glyphId) {
    case 'pantitlan':
      return (
        <g fill={color}>
          <rect x="-3.5" y="-15" width="2.4" height="30" rx="0.8" />
          <rect x="1.1" y="-15" width="2.4" height="30" rx="0.8" />
          <polygon points="-4,-13 -16,-8 -4,-3" />
          <polygon points="-4,2 -16,7 -4,12" />
          <polygon points="4,-13 16,-8 4,-3" />
          <polygon points="4,2 16,7 4,12" />
        </g>
      );

    case 'pino_suarez':
      return (
        <g fill={color}>
          <rect x="-15" y="7" width="30" height="5" rx="1" />
          <rect x="-12" y="1" width="24" height="5" rx="1" />
          <rect x="-9" y="-5" width="18" height="5" rx="1" />
          <path d="M -6 -6 A 6 6 0 0 1 6 -6 Z" />
          <rect x="-2" y="-14" width="4" height="3.5" rx="1" />
        </g>
      );

    case 'tacubaya':
      return (
        <g fill={color} stroke={color}>
          <rect x="-8" y="-14" width="16" height="4" rx="1.5" stroke="none" />
          <rect x="-4.5" y="-10" width="9" height="4.5" stroke="none" />
          <ellipse cx="0" cy="3" rx="11" ry="9.5" stroke="none" />
          <path d="M -9 -3 A 4.2 4.2 0 1 0 -9 6" fill="none" strokeWidth="2.4" />
          <path d="M 9 -3 A 4.2 4.2 0 1 1 9 6" fill="none" strokeWidth="2.4" />
          <rect x="-6.5" y="11" width="13" height="3" rx="1" stroke="none" />
        </g>
      );

    case 'chabacano':
      return (
        <g fill={color}>
          <ellipse cx="-3.5" cy="3" rx="7" ry="9.5" transform="rotate(-8 -3.5 3)" />
          <ellipse cx="3.5" cy="3" rx="7" ry="9.5" transform="rotate(8 3.5 3)" />
          <path d="M 0 -5 Q 1 -12 5 -14" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
          <ellipse cx="8" cy="-9" rx="6" ry="2.6" transform="rotate(-25 8 -9)" />
        </g>
      );

    case 'hidalgo':
      return (
        <path
          fill={color}
          d="M 3 -14 C -7 -13 -8 -5 -8 -4 L -12 0 L -8 2 L -9 5 L -6 8 L -8 14 L 7 14 C 12 7 11 -3 10 -8 C 9 -13 6 -14 3 -14 Z"
        />
      );

    case 'zocalo':
      return (
        <g fill={color}>
          <path d="M -15 -4 Q -7 -11 -2 -3 L -4 4 L -13 1 Z" />
          <path d="M 15 -4 Q 7 -11 2 -3 L 4 4 L 13 1 Z" />
          <ellipse cx="0" cy="1" rx="4" ry="7" />
          <circle cx="-1" cy="-8.5" r="3.4" />
          <polygon points="-3.5,-9.5 -7,-7.8 -3.5,-6.8" />
          <rect x="-9" y="9" width="18" height="3.8" rx="1" />
        </g>
      );

    case 'multi_cdf':
      return (
        <g>
          <g transform="translate(-7.5,-6.5) scale(0.42)">
            <CdmxStationGlyphSvg glyphId="tacubaya" color={color} />
          </g>
          <g transform="translate(7.5,-6.5) scale(0.42)">
            <CdmxStationGlyphSvg glyphId="chabacano" color={color} />
          </g>
          <g transform="translate(0,7.5) scale(0.44)">
            <CdmxStationGlyphSvg glyphId="zocalo" color={color} />
          </g>
        </g>
      );

    case 'multi_edf':
      return (
        <g>
          <g transform="translate(-7.5,-6.5) scale(0.42)">
            <CdmxStationGlyphSvg glyphId="hidalgo" color={color} />
          </g>
          <g transform="translate(7.5,-6.5) scale(0.42)">
            <CdmxStationGlyphSvg glyphId="chabacano" color={color} />
          </g>
          <g transform="translate(0,7.5) scale(0.44)">
            <CdmxStationGlyphSvg glyphId="zocalo" color={color} />
          </g>
        </g>
      );

    case 'deadend':
      return (
        <g stroke={color} strokeWidth="3.2" fill="none" strokeLinecap="round">
          <circle cx="0" cy="0" r="11" />
          <line x1="-8" y1="8" x2="8" y2="-8" />
        </g>
      );

    default:
      return (
        <g fill={color}>
          <rect x="-12" y="-11" width="5" height="22" rx="1.5" />
          <rect x="-2.5" y="-11" width="5" height="22" rx="1.5" />
          <rect x="7" y="-11" width="5" height="22" rx="1.5" />
          <rect x="-12" y="-11" width="24" height="4.5" rx="1" />
        </g>
      );
  }
};
