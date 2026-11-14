export type CdmxLineCode = '1' | '2' | '3' | '5' | '7' | '8' | '9' | 'A';

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
};

export interface StationVisualSpec {
  lines: CdmxLineCode[];
  primaryColor: string;
  secondaryColor: string;
  officialName: string;
  glyphId: 'pantitlan' | 'pino_suarez' | 'tacubaya' | 'chabacano' | 'hidalgo' | 'zocalo' | 'deadend' | 'multi_cdf' | 'multi_edf' | 'generic';
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
    officialName: 'Pantitlán [A]',
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
    officialName: 'Pino Suárez [B]',
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
  '[C,D,F]': {
    lines: ['1', '7', '9', '2', '8'],
    primaryColor: '#005CB9',
    secondaryColor: '#F26522',
    officialName: 'Tacubaya · Chabacano · Zócalo',
    glyphId: 'multi_cdf',
  },
  '[E,D,F]': {
    lines: ['2', '3', '8', '9'],
    primaryColor: '#005CB9',
    secondaryColor: '#A6A900',
    officialName: 'Hidalgo · Chabacano · Zócalo',
    glyphId: 'multi_edf',
  },
  '[∅]': {
    lines: [],
    primaryColor: '#E11D48',
    secondaryColor: '#334155',
    officialName: 'Vía Muerta [∅]',
    glyphId: 'deadend',
  },
};

export function getStationVisualSpec(id: string): StationVisualSpec {
  if (STATION_VISUAL_SPECS[id]) return STATION_VISUAL_SPECS[id];
  // Library generic fallback nodes (q0, q1, etc.)
  return {
    lines: ['1'],
    primaryColor: '#E91E8C',
    secondaryColor: '#F26522',
    officialName: id,
    glyphId: 'generic',
  };
}
