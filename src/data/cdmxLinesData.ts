export type CdmxLineCode = '1' | '2' | '3' | '5' | '7' | '8' | '9' | 'A' | 'B';

export interface CdmxLineInfo {
  code: CdmxLineCode;
  name: string;
  color: string;
  textColor: string;
}

export const CDMX_LINES: Record<CdmxLineCode, CdmxLineInfo> = {
  '1': { code: '1', name: 'Línea 1 · Observatorio–Pantitlán', color: '#E91E8C', textColor: '#FFFFFF' },
  '2': { code: '2', name: 'Línea 2 · Cuatro Caminos–Tasqueña', color: '#005CB9', textColor: '#FFFFFF' },
  '3': { code: '3', name: 'Línea 3 · Indios Verdes–Universidad', color: '#A6A900', textColor: '#FFFFFF' },
  '5': { code: '5', name: 'Línea 5 · Politécnico–Pantitlán', color: '#FACC15', textColor: '#18181B' },
  '7': { code: '7', name: 'Línea 7 · El Rosario–Barranca del Muerto', color: '#F26522', textColor: '#FFFFFF' },
  '8': { code: '8', name: 'Línea 8 · Garibaldi–Constitución de 1917', color: '#009A44', textColor: '#FFFFFF' },
  '9': { code: '9', name: 'Línea 9 · Tacubaya–Pantitlán', color: '#5B3A29', textColor: '#FFFFFF' },
  A: { code: 'A', name: 'Línea A · Pantitlán–La Paz', color: '#8B2682', textColor: '#FFFFFF' },
  B: { code: 'B', name: 'Línea B · Ciudad Azteca–Buenavista', color: '#16A34A', textColor: '#FFFFFF' },
};

export type CdmxGlyphId =
  | 'pantitlan'
  | 'pino_suarez'
  | 'tacubaya'
  | 'chabacano'
  | 'hidalgo'
  | 'zocalo'
  | 'bellas_artes'
  | 'balderas'
  | 'insurgentes'
  | 'universidad'
  | 'salto_del_agua'
  | 'san_lazaro'
  | 'deadend'
  | 'multi_cdf'
  | 'multi_edf'
  | 'generic';

export interface StationVisualSpec {
  lines: CdmxLineCode[];
  primaryColor: string;
  secondaryColor: string;
  officialName: string;
  glyphId: CdmxGlyphId;
  memberGlyphs?: CdmxGlyphId[];
}

export const STATION_VISUAL_SPECS: Record<string, StationVisualSpec> = {
  A: {
    lines: ['1', '5', '9', 'A'],
    primaryColor: '#E91E8C',
    secondaryColor: '#FACC15',
    officialName: 'Pantitlán',
    glyphId: 'pantitlan',
  },
  '[A]': {
    lines: ['1', '5', '9', 'A'],
    primaryColor: '#E91E8C',
    secondaryColor: '#FACC15',
    officialName: 'Pantitlán',
    glyphId: 'pantitlan',
  },
  B: {
    lines: ['1', '2'],
    primaryColor: '#E91E8C',
    secondaryColor: '#005CB9',
    officialName: 'Pino Suárez',
    glyphId: 'pino_suarez',
  },
  '[B]': {
    lines: ['1', '2'],
    primaryColor: '#E91E8C',
    secondaryColor: '#005CB9',
    officialName: 'Pino Suárez',
    glyphId: 'pino_suarez',
  },
  C: {
    lines: ['1', '7', '9'],
    primaryColor: '#E91E8C',
    secondaryColor: '#F26522',
    officialName: 'Tacubaya',
    glyphId: 'tacubaya',
  },
  D: {
    lines: ['2', '8', '9'],
    primaryColor: '#005CB9',
    secondaryColor: '#009A44',
    officialName: 'Chabacano',
    glyphId: 'chabacano',
  },
  E: {
    lines: ['2', '3'],
    primaryColor: '#005CB9',
    secondaryColor: '#A6A900',
    officialName: 'Hidalgo',
    glyphId: 'hidalgo',
  },
  F: {
    lines: ['2'],
    primaryColor: '#005CB9',
    secondaryColor: '#005CB9',
    officialName: 'Zócalo / Tenochtitlan',
    glyphId: 'zocalo',
  },
  G: {
    lines: ['2', '8'],
    primaryColor: '#005CB9',
    secondaryColor: '#009A44',
    officialName: 'Bellas Artes',
    glyphId: 'bellas_artes',
  },
  H: {
    lines: ['1', '3'],
    primaryColor: '#E91E8C',
    secondaryColor: '#A6A900',
    officialName: 'Balderas',
    glyphId: 'balderas',
  },
  I: {
    lines: ['1'],
    primaryColor: '#E91E8C',
    secondaryColor: '#E91E8C',
    officialName: 'Insurgentes',
    glyphId: 'insurgentes',
  },
  J: {
    lines: ['3'],
    primaryColor: '#A6A900',
    secondaryColor: '#A6A900',
    officialName: 'Universidad',
    glyphId: 'universidad',
  },
  K: {
    lines: ['1', '8'],
    primaryColor: '#E91E8C',
    secondaryColor: '#009A44',
    officialName: 'Salto del Agua',
    glyphId: 'salto_del_agua',
  },
  L: {
    lines: ['1', 'B'],
    primaryColor: '#E91E8C',
    secondaryColor: '#16A34A',
    officialName: 'San Lázaro',
    glyphId: 'san_lazaro',
  },
  '[C,D,F]': {
    lines: ['1', '7', '9', '2', '8'],
    primaryColor: '#005CB9',
    secondaryColor: '#F26522',
    officialName: 'Tacubaya · Chabacano · Zócalo',
    glyphId: 'multi_cdf',
    memberGlyphs: ['tacubaya', 'chabacano', 'zocalo'],
  },
  '[E,D,F]': {
    lines: ['2', '3', '8', '9'],
    primaryColor: '#005CB9',
    secondaryColor: '#A6A900',
    officialName: 'Hidalgo · Chabacano · Zócalo',
    glyphId: 'multi_edf',
    memberGlyphs: ['hidalgo', 'chabacano', 'zocalo'],
  },
  '[∅]': {
    lines: [],
    primaryColor: '#E11D48',
    secondaryColor: '#334155',
    officialName: 'Vía Muerta [∅]',
    glyphId: 'deadend',
  },
};

const ORDERED_SINGLE_SPECS: StationVisualSpec[] = [
  STATION_VISUAL_SPECS.A,
  STATION_VISUAL_SPECS.B,
  STATION_VISUAL_SPECS.C,
  STATION_VISUAL_SPECS.D,
  STATION_VISUAL_SPECS.E,
  STATION_VISUAL_SPECS.F,
  STATION_VISUAL_SPECS.G,
  STATION_VISUAL_SPECS.H,
  STATION_VISUAL_SPECS.I,
  STATION_VISUAL_SPECS.J,
  STATION_VISUAL_SPECS.K,
  STATION_VISUAL_SPECS.L,
];

function resolveSingleStateSpec(rawId: string): StationVisualSpec {
  const clean = rawId.trim();
  if (STATION_VISUAL_SPECS[clean]) return STATION_VISUAL_SPECS[clean];

  // Map Q0, Q1, q0, S0, etc. deterministically to official stations A..L
  const numMatch = clean.match(/(\d+)$/);
  if (numMatch) {
    const idx = parseInt(numMatch[1], 10) % ORDERED_SINGLE_SPECS.length;
    return ORDERED_SINGLE_SPECS[idx];
  }

  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  }
  return ORDERED_SINGLE_SPECS[hash % ORDERED_SINGLE_SPECS.length];
}

export function getStationVisualSpec(id: string): StationVisualSpec {
  if (STATION_VISUAL_SPECS[id]) return STATION_VISUAL_SPECS[id];
  if (id === '[∅]' || id === '∅') return STATION_VISUAL_SPECS['[∅]'];

  // Dynamic Subset State e.g. "[A,B]" or "[C,D,E,F]"
  if (id.startsWith('[') && id.endsWith(']')) {
    const inner = id.slice(1, -1).trim();
    const members = inner
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (members.length === 1) {
      const single = resolveSingleStateSpec(members[0]);
      return {
        ...single,
        officialName: single.officialName,
      };
    }

    if (members.length > 1) {
      const specs = members.map(resolveSingleStateSpec);
      const uniqueLines: CdmxLineCode[] = [];
      for (const sp of specs) {
        for (const l of sp.lines) {
          if (!uniqueLines.includes(l) && uniqueLines.length < 5) {
            uniqueLines.push(l);
          }
        }
      }
      const names = specs.slice(0, 3).map((s) => s.officialName.split('/')[0].trim());
      const memberGlyphs = specs.slice(0, 3).map((s) => s.glyphId);

      return {
        lines: uniqueLines.length > 0 ? uniqueLines : ['1', '2'],
        primaryColor: specs[0].primaryColor,
        secondaryColor: specs[1]?.primaryColor ?? specs[0].secondaryColor,
        officialName: names.join(' · '),
        glyphId: specs[0].glyphId,
        memberGlyphs,
      };
    }
  }

  return resolveSingleStateSpec(id);
}
