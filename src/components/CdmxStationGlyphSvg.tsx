import React from 'react';
import { CdmxGlyphId, StationVisualSpec } from '../data/cdmxLinesData';

interface CdmxStationGlyphSvgProps {
  glyphId: StationVisualSpec['glyphId'];
  memberGlyphs?: CdmxGlyphId[];
  color?: string;
}

export const CdmxStationGlyphSvg: React.FC<CdmxStationGlyphSvgProps> = ({
  glyphId,
  memberGlyphs,
  color = '#ffffff',
}) => {
  // Composite multi-station emblem for DFA Subset States (2 or 3 stations)
  if (memberGlyphs && memberGlyphs.length === 2) {
    return (
      <g>
        <g transform="translate(-7.2, 0) scale(0.5)">
          <CdmxStationGlyphSvg glyphId={memberGlyphs[0]} color={color} />
        </g>
        <circle cx="0" cy="0" r="1.3" fill={color} opacity="0.7" />
        <g transform="translate(7.2, 0) scale(0.5)">
          <CdmxStationGlyphSvg glyphId={memberGlyphs[1]} color={color} />
        </g>
      </g>
    );
  }

  if (memberGlyphs && memberGlyphs.length >= 3) {
    return (
      <g>
        <g transform="translate(-7.5, -6.2) scale(0.42)">
          <CdmxStationGlyphSvg glyphId={memberGlyphs[0]} color={color} />
        </g>
        <g transform="translate(7.5, -6.2) scale(0.42)">
          <CdmxStationGlyphSvg glyphId={memberGlyphs[1]} color={color} />
        </g>
        <g transform="translate(0, 7.4) scale(0.45)">
          <CdmxStationGlyphSvg glyphId={memberGlyphs[2]} color={color} />
        </g>
      </g>
    );
  }

  switch (glyphId) {
    case 'pantitlan':
      // Official Pantitlán: Two ceremonial poles with 4 waving triangular banners & finials
      return (
        <g fill={color}>
          <circle cx="-2.4" cy="-14.5" r="1.7" />
          <circle cx="2.4" cy="-14.5" r="1.7" />
          <rect x="-3.5" y="-14" width="2.3" height="29" rx="0.9" />
          <rect x="1.2" y="-14" width="2.3" height="29" rx="0.9" />
          {/* Left waving banners */}
          <path d="M -3.5 -12.5 L -16.2 -8.2 L -13.5 -5.2 L -16.2 -3.4 L -3.5 -1.8 Z" />
          <path d="M -3.5 1.8 L -16.2 6.1 L -13.5 9.1 L -16.2 10.9 L -3.5 12.5 Z" />
          {/* Right waving banners */}
          <path d="M 3.5 -12.5 L 16.2 -8.2 L 13.5 -5.2 L 16.2 -3.4 L 3.5 -1.8 Z" />
          <path d="M 3.5 1.8 L 16.2 6.1 L 13.5 9.1 L 16.2 10.9 L 3.5 12.5 Z" />
        </g>
      );

    case 'pino_suarez':
      // Official Pino Suárez: Stepped circular Adoratorio de Ehécatl pyramid with stairway
      return (
        <g fill={color}>
          <rect x="-15.5" y="8" width="31" height="4.8" rx="1" />
          <rect x="-12.5" y="2.2" width="25" height="4.8" rx="1" />
          <rect x="-9.5" y="-3.6" width="19" height="4.8" rx="1" />
          {/* Circular sanctuary temple & roof */}
          <path d="M -6.8 -4.4 A 6.8 6.4 0 0 1 6.8 -4.4 Z" />
          <rect x="-8" y="-5.6" width="16" height="1.8" rx="0.8" />
          <rect x="-2.4" y="-13.8" width="4.8" height="3.8" rx="1" />
          {/* Central stair balustrade accent */}
          <path d="M -2.5 12.8 L -1.6 -3.6 L 1.6 -3.6 L 2.5 12.8 Z" fill="#0f172a" opacity="0.28" />
        </g>
      );

    case 'tacubaya':
      // Official Tacubaya: Pre-Hispanic water vessel (cántaro/apaztle) with dual loop handles
      return (
        <g fill={color} stroke={color}>
          {/* Flared rim */}
          <rect x="-8.5" y="-14.5" width="17" height="3.8" rx="1.6" stroke="none" />
          {/* Neck */}
          <rect x="-5" y="-10.8" width="10" height="4.8" stroke="none" />
          {/* Globular vessel body */}
          <ellipse cx="0" cy="2.6" rx="10.8" ry="9.4" stroke="none" />
          {/* Water wave band cutout */}
          <path
            d="M -7 1.5 Q -3.5 -1.2 0 1.5 T 7 1.5"
            fill="none"
            stroke="#0f172a"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.32"
          />
          {/* Curved side handles */}
          <path d="M -8.6 -3.8 A 4.4 4.6 0 1 0 -8.6 6.2" fill="none" strokeWidth="2.5" />
          <path d="M 8.6 -3.8 A 4.4 4.6 0 1 1 8.6 6.2" fill="none" strokeWidth="2.5" />
          {/* Flat base */}
          <rect x="-6.8" y="11" width="13.6" height="3.2" rx="1.2" stroke="none" />
        </g>
      );

    case 'chabacano':
      // Official Chabacano: Apricot fruit with central cleft, stem & leaf
      return (
        <g fill={color}>
          <ellipse cx="-3.6" cy="3.2" rx="7.2" ry="9.6" transform="rotate(-7 -3.6 3.2)" />
          <ellipse cx="3.6" cy="3.2" rx="7.2" ry="9.6" transform="rotate(7 3.6 3.2)" />
          {/* Apricot cleft crease */}
          <path
            d="M -0.5 -4.2 Q -2.2 3 0 10.5"
            fill="none"
            stroke="#0f172a"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.28"
          />
          {/* Curved stem */}
          <path
            d="M 0 -5.2 Q 0.8 -12.2 5.2 -14.2"
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Pointed leaf */}
          <path d="M 2.5 -10.2 Q 8.5 -14.5 14 -9.2 Q 8.2 -5.5 2.5 -10.2 Z" />
        </g>
      );

    case 'hidalgo':
      // Official Hidalgo: Classical profile bust of Don Miguel Hidalgo facing left
      return (
        <g fill={color}>
          <path d="M 2.5 -14.2 C -6.2 -13.5 -7.8 -6.5 -7.6 -4.2 L -12.2 0.2 L -8.4 1.8 L -9.6 4.5 L -6.8 7.5 L -8.6 14.2 L 7.8 14.2 C 12.2 7.5 11.4 -2.2 10.2 -7.8 C 9 -12.6 6 -14.2 2.5 -14.2 Z" />
          {/* Flowing white hair wave accent */}
          <path
            d="M 3.5 -9.5 Q 8.2 -4 6.2 4.5"
            fill="none"
            stroke="#0f172a"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.28"
          />
        </g>
      );

    case 'zocalo':
      // Official Zócalo / Tenochtitlan: Royal Mexican Eagle perched on nopal cactus
      return (
        <g fill={color}>
          {/* Spread feathered wings */}
          <path d="M -15.5 -4.5 Q -8 -12.5 -2 -3.2 L -3.8 4.2 L -13.8 1.2 Z" />
          <path d="M 15.5 -4.5 Q 8 -12.5 2 -3.2 L 3.8 4.2 L 13.8 1.2 Z" />
          {/* Eagle torso & crowned head */}
          <ellipse cx="0" cy="0.8" rx="4.2" ry="7.2" />
          <circle cx="-0.8" cy="-8.8" r="3.6" />
          {/* Hooked beak facing left */}
          <polygon points="-3.6,-10.2 -8.2,-8.2 -3.6,-6.8" />
          {/* Nopal cactus pads & stone base */}
          <ellipse cx="-5.5" cy="7.5" rx="3.4" ry="2.1" transform="rotate(-22 -5.5 7.5)" />
          <ellipse cx="5.5" cy="7.5" rx="3.4" ry="2.1" transform="rotate(22 5.5 7.5)" />
          <rect x="-9.5" y="9.5" width="19" height="3.8" rx="1.2" />
        </g>
      );

    case 'bellas_artes':
      // Official Bellas Artes: Neoclassical ribbed dome & grand portico columns
      return (
        <g fill={color}>
          {/* Ribbed cupola dome */}
          <path d="M -11 -2 A 11 10.5 0 0 1 11 -2 Z" />
          <circle cx="0" cy="-13.5" r="2" />
          {/* Archways cornice */}
          <rect x="-14" y="-2" width="28" height="3" rx="0.8" />
          {/* 4 columns */}
          <rect x="-12.5" y="1" width="3.2" height="10" />
          <rect x="-5.2" y="1" width="3.2" height="10" />
          <rect x="2" y="1" width="3.2" height="10" />
          <rect x="9.3" y="1" width="3.2" height="10" />
          {/* Steps base */}
          <rect x="-15" y="11" width="30" height="3.2" rx="1" />
        </g>
      );

    case 'balderas':
      // Official Balderas: 19th-century La Ciudadela artillery cannon on spoked wheel
      return (
        <g fill={color}>
          {/* Tilted cannon barrel */}
          <path d="M -14.5 -5.5 L 12.5 -10.5 L 13.5 -5.2 L -13.5 -0.5 Z" />
          <circle cx="-14.5" cy="-3" r="2.2" />
          {/* Gun carriage cheek */}
          <polygon points="-8,-1 6,-1 10,8 -11,8" />
          {/* Spoked artillery wheel */}
          <circle
            cx="-1"
            cy="6.5"
            r="6.8"
            fill="none"
            stroke={color}
            strokeWidth="2.6"
          />
          <circle cx="-1" cy="6.5" r="2.2" />
        </g>
      );

    case 'insurgentes':
      // Official Insurgentes: Campana de Dolores bell with wooden yoke
      return (
        <g fill={color}>
          {/* Top crown yoke */}
          <rect x="-6.5" y="-14" width="13" height="3.5" rx="1.2" />
          <rect x="-2.5" y="-10.5" width="5" height="2.5" />
          {/* Flared bell body */}
          <path d="M -7.5 -8 C -8.5 1 -13.5 7 -14.5 9.5 L 14.5 9.5 C 13.5 7 8.5 1 7.5 -8 Z" />
          {/* Clapper */}
          <circle cx="0" cy="12" r="3" />
        </g>
      );

    case 'universidad':
      // Official Universidad: UNAM double-headed eagle & condor shield crest
      return (
        <g fill={color}>
          {/* Outer shield contour */}
          <path d="M -12 -12 L 12 -12 L 11 1 C 10 8 0 14 0 14 C 0 14 -10 8 -11 1 Z" />
          {/* Inner cutout V */}
          <path
            d="M -6 -7 L 0 -2 L 6 -7 L 5 2 L 0 8 L -5 2 Z"
            fill="#0f172a"
            opacity="0.3"
          />
          <circle cx="-4.5" cy="-13" r="2" />
          <circle cx="4.5" cy="-13" r="2" />
        </g>
      );

    case 'salto_del_agua':
      // Official Salto del Agua: Colonial stone fountain with water jets
      return (
        <g fill={color}>
          <path
            d="M 0 -4 Q -7 -13 -13 -6 M 0 -4 Q 7 -13 13 -6 M 0 -6 L 0 -14"
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Fountain basin */}
          <path d="M -14 -1 L 14 -1 L 10 6 L -10 6 Z" />
          <rect x="-4" y="6" width="8" height="5" />
          <rect x="-11" y="11" width="22" height="3.2" rx="1" />
        </g>
      );

    case 'san_lazaro':
      // Official San Lázaro: Classic steam locomotive front with smokestack & cowcatcher
      return (
        <g fill={color}>
          {/* Smokestack */}
          <polygon points="-3.5,-14.5 3.5,-14.5 2.2,-7 -2.2,-7" />
          {/* Boiler face */}
          <circle cx="0" cy="0" r="8.2" />
          <circle cx="0" cy="0" r="3" fill="#0f172a" opacity="0.32" />
          {/* Cowcatcher */}
          <polygon points="-9,7 9,7 13,13.5 -13,13.5" />
        </g>
      );

    case 'multi_cdf':
      return (
        <CdmxStationGlyphSvg
          glyphId="tacubaya"
          memberGlyphs={['tacubaya', 'chabacano', 'zocalo']}
          color={color}
        />
      );

    case 'multi_edf':
      return (
        <CdmxStationGlyphSvg
          glyphId="hidalgo"
          memberGlyphs={['hidalgo', 'chabacano', 'zocalo']}
          color={color}
        />
      );

    case 'deadend':
      return (
        <g stroke={color} strokeWidth="3.2" fill="none" strokeLinecap="round">
          <circle cx="0" cy="0" r="11" />
          <line x1="-7.8" y1="7.8" x2="7.8" y2="-7.8" />
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
