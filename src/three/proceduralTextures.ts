import * as THREE from 'three';
import { CDMX_LINES, getStationVisualSpec, StationVisualSpec } from '../data/cdmxLinesData';

/**
 * Draws authentic Lance Wyman-inspired STC Metro CDMX station pictograms.
 */
function drawOfficialStationGlyph(
  ctx: CanvasRenderingContext2D,
  glyphId: StationVisualSpec['glyphId'],
  cx: number,
  cy: number,
  size: number,
  color: string,
  memberGlyphs?: StationVisualSpec['memberGlyphs']
) {
  if (memberGlyphs && memberGlyphs.length === 2) {
    const r = size * 0.42;
    drawOfficialStationGlyph(ctx, memberGlyphs[0], cx - r * 0.48, cy, size * 0.48, color);
    drawOfficialStationGlyph(ctx, memberGlyphs[1], cx + r * 0.48, cy, size * 0.48, color);
    return;
  }
  if (memberGlyphs && memberGlyphs.length >= 3) {
    const r = size * 0.42;
    drawOfficialStationGlyph(ctx, memberGlyphs[0], cx - r * 0.48, cy - r * 0.42, size * 0.44, color);
    drawOfficialStationGlyph(ctx, memberGlyphs[1], cx + r * 0.48, cy - r * 0.42, size * 0.44, color);
    drawOfficialStationGlyph(ctx, memberGlyphs[2], cx, cy + r * 0.46, size * 0.48, color);
    return;
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const r = size * 0.42;

  switch (glyphId) {
    case 'pantitlan': {
      // Official Pantitlán: Two vertical poles with 4 triangular flags waving outward
      const poleW = r * 0.14;
      ctx.fillRect(-r * 0.14, -r * 0.85, poleW, r * 1.7);
      ctx.fillRect(r * 0.02, -r * 0.85, poleW, r * 1.7);

      // Left two flags (pointing left)
      [-0.55, 0.1].forEach((yTop) => {
        ctx.beginPath();
        ctx.moveTo(-r * 0.16, yTop * r);
        ctx.lineTo(-r * 0.92, (yTop + 0.24) * r);
        ctx.lineTo(-r * 0.16, (yTop + 0.48) * r);
        ctx.closePath();
        ctx.fill();
      });

      // Right two flags (pointing right)
      [-0.55, 0.1].forEach((yTop) => {
        ctx.beginPath();
        ctx.moveTo(r * 0.18, yTop * r);
        ctx.lineTo(r * 0.94, (yTop + 0.24) * r);
        ctx.lineTo(r * 0.18, (yTop + 0.48) * r);
        ctx.closePath();
        ctx.fill();
      });
      break;
    }

    case 'pino_suarez': {
      // Official Pino Suárez: Stepped circular Adoratorio de Ehécatl pyramid
      ctx.fillRect(-r * 0.92, r * 0.48, r * 1.84, r * 0.3);
      ctx.fillRect(-r * 0.72, r * 0.1, r * 1.44, r * 0.3);
      ctx.fillRect(-r * 0.52, -r * 0.28, r * 1.04, r * 0.3);
      // Circular sanctuary dome + finial
      ctx.beginPath();
      ctx.arc(0, -r * 0.46, r * 0.34, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-r * 0.1, -r * 0.92, r * 0.2, r * 0.18);
      break;
    }

    case 'tacubaya': {
      // Official Tacubaya: Pre-Hispanic water vessel (cántaro) with handles & rim
      // Flared lip
      ctx.beginPath();
      ctx.roundRect(-r * 0.48, -r * 0.85, r * 0.96, r * 0.22, r * 0.08);
      ctx.fill();
      // Neck
      ctx.fillRect(-r * 0.26, -r * 0.65, r * 0.52, r * 0.28);
      // Vessel body
      ctx.beginPath();
      ctx.ellipse(0, r * 0.18, r * 0.68, r * 0.58, 0, 0, Math.PI * 2);
      ctx.fill();
      // Side handles
      ctx.lineWidth = Math.max(3, r * 0.15);
      ctx.beginPath();
      ctx.arc(-r * 0.58, -r * 0.05, r * 0.24, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(r * 0.58, -r * 0.05, r * 0.24, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.stroke();
      // Flat base foot
      ctx.fillRect(-r * 0.38, r * 0.68, r * 0.76, r * 0.16);
      break;
    }

    case 'chabacano': {
      // Official Chabacano: Apricot fruit with cleft + stem + leaf
      // Left and right rounded lobes
      ctx.beginPath();
      ctx.ellipse(-r * 0.22, r * 0.16, r * 0.44, r * 0.58, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(r * 0.22, r * 0.16, r * 0.44, r * 0.58, 0.1, 0, Math.PI * 2);
      ctx.fill();
      // Stem
      ctx.lineWidth = Math.max(3, r * 0.14);
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.32);
      ctx.quadraticCurveTo(r * 0.05, -r * 0.72, r * 0.26, -r * 0.86);
      ctx.stroke();
      // Leaf
      ctx.beginPath();
      ctx.ellipse(r * 0.45, -r * 0.56, r * 0.38, r * 0.16, -0.45, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'hidalgo': {
      // Official Hidalgo: Recognizable side profile of Miguel Hidalgo facing left
      ctx.beginPath();
      ctx.moveTo(r * 0.18, -r * 0.84); // Top crown
      ctx.quadraticCurveTo(-r * 0.42, -r * 0.82, -r * 0.45, -r * 0.32); // Forehead
      ctx.lineTo(-r * 0.68, -r * 0.04); // Nose tip
      ctx.lineTo(-r * 0.46, r * 0.06); // Upper lip
      ctx.lineTo(-r * 0.52, r * 0.22); // Chin
      ctx.lineTo(-r * 0.36, r * 0.38); // Jaw
      ctx.lineTo(-r * 0.48, r * 0.82); // Collar front
      ctx.lineTo(r * 0.42, r * 0.82); // Collar back
      ctx.quadraticCurveTo(r * 0.72, r * 0.35, r * 0.66, -r * 0.22); // Flowing back hair
      ctx.quadraticCurveTo(r * 0.62, -r * 0.78, r * 0.18, -r * 0.84);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'zocalo': {
      // Official Zócalo / Tenochtitlan: Stylized Mexican National Eagle on nopal
      // Outstretched wings
      ctx.beginPath();
      ctx.moveTo(-r * 0.92, -r * 0.25);
      ctx.quadraticCurveTo(-r * 0.45, -r * 0.65, -r * 0.12, -r * 0.22);
      ctx.lineTo(-r * 0.25, r * 0.25);
      ctx.lineTo(-r * 0.78, r * 0.05);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(r * 0.92, -r * 0.25);
      ctx.quadraticCurveTo(r * 0.45, -r * 0.65, r * 0.12, -r * 0.22);
      ctx.lineTo(r * 0.25, r * 0.25);
      ctx.lineTo(r * 0.78, r * 0.05);
      ctx.closePath();
      ctx.fill();

      // Eagle body & head facing left
      ctx.beginPath();
      ctx.ellipse(0, r * 0.04, r * 0.24, r * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-r * 0.08, -r * 0.52, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
      // Beak
      ctx.beginPath();
      ctx.moveTo(-r * 0.22, -r * 0.58);
      ctx.lineTo(-r * 0.42, -r * 0.48);
      ctx.lineTo(-r * 0.22, -r * 0.42);
      ctx.closePath();
      ctx.fill();
      // Nopal / Pedestal base
      ctx.fillRect(-r * 0.55, r * 0.55, r * 1.1, r * 0.22);
      ctx.beginPath();
      ctx.arc(-r * 0.35, r * 0.44, r * 0.14, 0, Math.PI * 2);
      ctx.arc(r * 0.35, r * 0.44, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'multi_cdf': {
      // Trio emblem for [C,D,F]: Tacubaya + Chabacano + Zócalo
      drawOfficialStationGlyph(ctx, 'tacubaya', -r * 0.48, -r * 0.42, size * 0.44, color);
      drawOfficialStationGlyph(ctx, 'chabacano', r * 0.48, -r * 0.42, size * 0.44, color);
      drawOfficialStationGlyph(ctx, 'zocalo', 0, r * 0.46, size * 0.48, color);
      break;
    }

    case 'multi_edf': {
      // Trio emblem for [E,D,F]: Hidalgo + Chabacano + Zócalo
      drawOfficialStationGlyph(ctx, 'hidalgo', -r * 0.48, -r * 0.42, size * 0.44, color);
      drawOfficialStationGlyph(ctx, 'chabacano', r * 0.48, -r * 0.42, size * 0.44, color);
      drawOfficialStationGlyph(ctx, 'zocalo', 0, r * 0.46, size * 0.48, color);
      break;
    }

    case 'bellas_artes': {
      // Neoclassical dome + 4 columns + base
      ctx.beginPath();
      ctx.arc(0, -r * 0.12, r * 0.68, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -r * 0.86, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-r * 0.85, -r * 0.12, r * 1.7, r * 0.18);
      [-0.72, -0.28, 0.16, 0.56].forEach((xCol) => {
        ctx.fillRect(xCol * r, r * 0.06, r * 0.18, r * 0.58);
      });
      ctx.fillRect(-r * 0.92, r * 0.64, r * 1.84, r * 0.2);
      break;
    }

    case 'balderas': {
      // Artillery cannon + spoked wheel
      ctx.beginPath();
      ctx.moveTo(-r * 0.88, -r * 0.32);
      ctx.lineTo(r * 0.78, -r * 0.64);
      ctx.lineTo(r * 0.84, -r * 0.3);
      ctx.lineTo(-r * 0.82, -r * 0.02);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = Math.max(4, r * 0.18);
      ctx.beginPath();
      ctx.arc(-r * 0.06, r * 0.36, r * 0.42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-r * 0.06, r * 0.36, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'insurgentes': {
      // Campana de Dolores bell
      ctx.fillRect(-r * 0.42, -r * 0.86, r * 0.84, r * 0.22);
      ctx.beginPath();
      ctx.moveTo(-r * 0.46, -r * 0.52);
      ctx.quadraticCurveTo(-r * 0.55, r * 0.2, -r * 0.88, r * 0.58);
      ctx.lineTo(r * 0.88, r * 0.58);
      ctx.quadraticCurveTo(r * 0.55, r * 0.2, r * 0.46, -r * 0.52);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, r * 0.74, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'universidad': {
      // Shield crest
      ctx.beginPath();
      ctx.moveTo(-r * 0.74, -r * 0.75);
      ctx.lineTo(r * 0.74, -r * 0.75);
      ctx.quadraticCurveTo(r * 0.7, r * 0.45, 0, r * 0.86);
      ctx.quadraticCurveTo(-r * 0.7, r * 0.45, -r * 0.74, -r * 0.75);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'salto_del_agua': {
      // Colonial fountain & water jets
      ctx.lineWidth = Math.max(3, r * 0.15);
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.2);
      ctx.quadraticCurveTo(-r * 0.45, -r * 0.82, -r * 0.82, -r * 0.36);
      ctx.moveTo(0, -r * 0.2);
      ctx.quadraticCurveTo(r * 0.45, -r * 0.82, r * 0.82, -r * 0.36);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.86, -r * 0.06);
      ctx.lineTo(r * 0.86, -r * 0.06);
      ctx.lineTo(r * 0.62, r * 0.36);
      ctx.lineTo(-r * 0.62, r * 0.36);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-r * 0.26, r * 0.36, r * 0.52, r * 0.32);
      ctx.fillRect(-r * 0.68, r * 0.68, r * 1.36, r * 0.2);
      break;
    }

    case 'san_lazaro': {
      // Steam locomotive front
      ctx.fillRect(-r * 0.2, -r * 0.88, r * 0.4, r * 0.45);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.52, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-r * 0.56, r * 0.45);
      ctx.lineTo(r * 0.56, r * 0.45);
      ctx.lineTo(r * 0.82, r * 0.85);
      ctx.lineTo(-r * 0.82, r * 0.85);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'deadend': {
      ctx.lineWidth = Math.max(5, r * 0.24);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.52, r * 0.52);
      ctx.lineTo(r * 0.52, -r * 0.52);
      ctx.stroke();
      break;
    }

    default: {
      // Official STC Metro CDMX 'M' 3-band emblem
      const w = r * 0.32;
      ctx.beginPath();
      ctx.roundRect(-r * 0.76, -r * 0.7, w, r * 1.4, w * 0.3);
      ctx.roundRect(-w * 0.5, -r * 0.7, w, r * 1.4, w * 0.3);
      ctx.roundRect(r * 0.76 - w, -r * 0.7, w, r * 1.4, w * 0.3);
      ctx.fill();
      ctx.fillRect(-r * 0.76, -r * 0.7, r * 1.52, r * 0.28);
      break;
    }
  }

  ctx.restore();
}

/**
 * Helper to fill a rounded rectangle with multi-line CDMX Metro colors (vertical/diagonal bands).
 */
function fillMultiLineTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  colors: string[]
) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.clip();

  if (colors.length <= 1) {
    ctx.fillStyle = colors[0] ?? '#F26522';
    ctx.fillRect(x, y, w, h);
  } else {
    // Diagonal/vertical multi-line split exactly like STC Metro correspondence tiles
    const sliceW = w / colors.length;
    colors.forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.fillRect(x + i * sliceW, y, sliceW + 1, h);
    });
    // Dark translucent scrim so white official icon pops crisply over bright lines (e.g. L5 Yellow)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.24)';
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.stroke();
  ctx.restore();
}

export function createUrbanPlazaTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#dde3eb';
  ctx.fillRect(0, 0, size, size);

  const tile = 64;
  for (let y = 0; y < size; y += tile) {
    for (let x = 0; x < size; x += tile) {
      const idx = (x / tile + y / tile) % 3;
      ctx.fillStyle = idx === 0 ? '#e3e8ef' : idx === 1 ? '#d7dfe8' : '#dde4ec';
      ctx.fillRect(x + 1, y + 1, tile - 2, tile - 2);
    }
  }

  ctx.strokeStyle = '#c4cdd9';
  ctx.lineWidth = 2;
  for (let i = 0; i <= size; i += tile) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(242, 101, 34, 0.12)';
  ctx.fillRect(0, size * 0.46, size, size * 0.08);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createStationSignTexture(
  code: string,
  subtitle: string,
  variant: 'normal' | 'accept' | 'deadend' | 'start',
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  const spec = getStationVisualSpec(code);
  const lineColors =
    spec.lines.length > 0
      ? spec.lines.map((l) => CDMX_LINES[l].color)
      : variant === 'deadend'
      ? ['#E11D48', '#334155']
      : ['#F26522'];

  // Dark slate Metro CDMX signage background
  ctx.fillStyle = variant === 'accept' ? '#042f24' : variant === 'deadend' ? '#3b0714' : '#0f172a';
  ctx.fillRect(0, 0, 768, 384);

  // Top multi-line color header band (shows ALL original Metro lines of the station!)
  const bandW = 768 / lineColors.length;
  lineColors.forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.fillRect(i * bandW, 0, bandW + 1, 34);
  });

  // White thin pinstripe under line color band
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 34, 768, 6);

  // Left official CDMX Metro rounded-square emblem tile (Extra large & high contrast)
  fillMultiLineTile(ctx, 26, 62, 238, 238, 32, lineColors);

  // Crisp full-contrast white official Lance Wyman pictogram inside tile with dark drop shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  drawOfficialStationGlyph(ctx, spec.glyphId, 145, 178, 186, '#ffffff', spec.memberGlyphs);
  ctx.restore();

  // Corner Automata State Badge (e.g. A, B, C...) in bottom-left of emblem tile
  const badgeW = Math.max(66, code.length * 21 + 26);
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.roundRect(18, 266, badgeW, 48, 12);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  const badgeFont = code.length > 4 ? 22 : code.length > 2 ? 25 : 30;
  ctx.font = `900 ${badgeFont}px "IBM Plex Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(code, 18 + badgeW / 2, 291);

  // Right side: Official Station Name
  const displayName = spec.officialName !== code ? spec.officialName : subtitle;
  ctx.fillStyle = '#ffffff';
  ctx.font = displayName.length > 16 ? '800 40px "Outfit", sans-serif' : '800 52px "Outfit", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(displayName.slice(0, 22), 290, 108);

  // Official Line Number Squares ([1] [5] [9] [A])
  let badgeX = 290;
  if (spec.lines.length > 0) {
    spec.lines.forEach((lineCode) => {
      const info = CDMX_LINES[lineCode];
      ctx.fillStyle = info.color;
      ctx.beginPath();
      ctx.roundRect(badgeX, 156, 56, 56, 11);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = info.textColor;
      ctx.font = '800 32px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(info.code, badgeX + 28, 185);
      badgeX += 68;
    });
  } else {
    ctx.fillStyle = '#fda4af';
    ctx.font = '700 26px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('POZO · VÍA MUERTA', 290, 184);
  }

  // Automata status subtitle
  ctx.textAlign = 'left';
  ctx.fillStyle =
    variant === 'accept' ? '#6ee7b7' : variant === 'deadend' ? '#fda4af' : '#e2e8f0';
  ctx.font = '700 26px "Plus Jakarta Sans", sans-serif';
  const statusText =
    variant === 'accept'
      ? 'SALIDA VÁLIDA · EF = 1'
      : variant === 'deadend'
      ? 'VÍA MUERTA · SIN SALIDA'
      : variant === 'start'
      ? 'TERMINAL INICIO · TRANSBORDO'
      : 'CORRESPONDENCIA ACTIVA';
  ctx.fillText(statusText, 290, 256);

  // Bottom bar with official line colors mirror
  lineColors.forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.fillRect(i * bandW, 362, bandW + 1, 22);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Vertical STC Metro CDMX entrance totem texture ("Tótem oficial")
 */
export function createMetroTotemTexture(
  code: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const spec = getStationVisualSpec(code);
  const lineColors = spec.lines.length > 0 ? spec.lines.map((l) => CDMX_LINES[l].color) : ['#E11D48'];

  // Brushed dark anthracite totem body
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, 192, 512);

  // Top official STC Metro 'M' Orange Box
  ctx.fillStyle = '#F26522';
  ctx.beginPath();
  ctx.roundRect(22, 22, 148, 128, 18);
  ctx.fill();
  drawOfficialStationGlyph(ctx, 'generic', 96, 86, 98, '#ffffff');

  // "METRO" header label
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 26px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('METRO', 96, 178);

  // Station official pictogram box in line colors
  fillMultiLineTile(ctx, 22, 206, 148, 148, 20, lineColors);
  drawOfficialStationGlyph(ctx, spec.glyphId, 96, 280, 108, '#ffffff', spec.memberGlyphs);

  // Official Line badges row at bottom
  const totalW = spec.lines.length * 34 + Math.max(0, spec.lines.length - 1) * 6;
  let bx = (192 - totalW) / 2;
  spec.lines.forEach((lineCode) => {
    const info = CDMX_LINES[lineCode];
    ctx.fillStyle = info.color;
    ctx.beginPath();
    ctx.roundRect(bx, 382, 34, 34, 6);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = info.textColor;
    ctx.font = '700 18px "Outfit", sans-serif';
    ctx.fillText(info.code, bx + 17, 400);
    bx += 40;
  });

  // Bottom color accent stripe
  const bandW = 192 / lineColors.length;
  lineColors.forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.fillRect(i * bandW, 476, bandW + 1, 36);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createTrainDestinationTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 252, 60);

  ctx.fillStyle = '#fb923c';
  ctx.font = '700 22px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('L1 PANTITLÁN', 128, 34);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 6, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.55)');
  grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.22)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Minimalist architectural micro-plaque texture for 3D symbols, tracks,
 * ε skybridges, turnstiles, and CDMX landmarks.
 */
export function createMiniLabelTexture(
  symbol: string,
  caption: string,
  accentColor: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 384, 96);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.beginPath();
  ctx.roundRect(6, 6, 372, 84, 18);
  ctx.fill();

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Left symbol chip
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.roundRect(16, 16, 72, 64, 12);
  ctx.fill();

  const isLightChip = accentColor.toUpperCase() === '#FACC15';
  ctx.fillStyle = isLightChip ? '#18181b' : '#ffffff';
  const symFont = symbol.length > 3 ? 20 : symbol.length > 1 ? 26 : 34;
  ctx.font = `700 ${symFont}px "IBM Plex Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol, 52, 49);

  // Minimalist caption text
  ctx.fillStyle = '#f8fafc';
  ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(caption.slice(0, 22), 102, 49);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}
