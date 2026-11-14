export type RegexPatternId = 'concat' | 'kleene' | 'plus' | 'union' | 'optional' | 'exercise';

export interface MiniNode {
  id: string;
  x: number;
  y: number;
  isStart?: boolean;
  isAccept?: boolean;
}

export interface MiniEdge {
  from: string;
  to: string;
  label: string;
  kind: 'train' | 'walk';
  curve?: 'top' | 'bottom' | 'straight';
}

export interface MiniTableRow {
  state: string;
  onA: string;
  onB: string;
  onEps: string;
  ef: '∅' | '1';
}

export interface RegexPatternGuide {
  id: RegexPatternId;
  expression: string;
  title: string;
  tag: string;
  howToSpot: string;
  metroAnalogy: string;
  diagramRule: string;
  tableRule: string;
  differenceHighlight: string;
  validExamples: string[];
  invalidExamples: string[];
  nodes: MiniNode[];
  edges: MiniEdge[];
  tableRows: MiniTableRow[];
}

export const REGEX_LIBRARY: RegexPatternGuide[] = [
  {
    id: 'concat',
    expression: 'ab',
    title: 'Concatenación (En serie)',
    tag: 'Bloque básico 1',
    howToSpot: 'Letras pegadas sin símbolos (*, +, |, ?). Significa: primero "a" y OBLIGATORIO después "b".',
    metroAnalogy:
      'Es un viaje directo con una escala obligatoria: subes en A con boleto "a" hasta B, y de B tomas el tren "b" hasta la salida C.',
    diagramRule:
      'Solo dibuja estaciones en línea recta conectadas por flechas sólidas. NO requiere pasillos gratis (ε).',
    tableRule:
      'En la tabla, cada estación solo apunta a la siguiente bajo su boleto exacto. Todo lo demás queda en ∅.',
    differenceHighlight: 'A diferencia de (a|b), aquí NO puedes elegir camino: tienes que hacer ambos pasos en orden.',
    validExamples: ['ab'],
    invalidExamples: ['a', 'b', 'ba', 'aba'],
    nodes: [
      { id: 'A', x: 110, y: 120, isStart: true },
      { id: 'B', x: 260, y: 120 },
      { id: 'C', x: 410, y: 120, isAccept: true },
    ],
    edges: [
      { from: 'A', to: 'B', label: 'a', kind: 'train', curve: 'straight' },
      { from: 'B', to: 'C', label: 'b', kind: 'train', curve: 'straight' },
    ],
    tableRows: [
      { state: 'A', onA: 'B', onB: '∅', onEps: '∅', ef: '∅' },
      { state: 'B', onA: '∅', onB: 'C', onEps: '∅', ef: '∅' },
      { state: 'C', onA: '∅', onB: '∅', onEps: '∅', ef: '1' },
    ],
  },
  {
    id: 'kleene',
    expression: 'a*',
    title: 'Estrella de Kleene (0 o más)',
    tag: 'Bloque básico 2',
    howToSpot: 'Tiene un asterisco (*) arriba. Significa: puedes repetir "a" infinitas veces, ¡o incluso NO tomarla (0 veces)!',
    metroAnalogy:
      'Al entrar a C decides gratis (ε): o tomas el atajo directo a la salida F sin pagar nada, o entras al andén D para pagar "a" las veces que quieras.',
    diagramRule:
      'Es la plantilla clásica de 4 pasillos ε: entrada (C→D), tren (D→E), regreso arriba (E→D), salida (E→F) y atajo abajo (C→F).',
    tableRule:
      'Como C tiene atajo directo ε a F, al calcular ε-C(C) obtienes {C,D,F} y la fila C hereda salida válida (EF = 1).',
    differenceHighlight: 'A diferencia de a+, aquí sí se acepta no mostrar ningún boleto (cadena vacía ε) gracias al arco inferior C→F.',
    validExamples: ['ε (vacía)', 'a', 'aa', 'aaa'],
    invalidExamples: ['b', 'ab'],
    nodes: [
      { id: 'C', x: 90, y: 120, isStart: true },
      { id: 'D', x: 210, y: 120 },
      { id: 'E', x: 330, y: 120 },
      { id: 'F', x: 450, y: 120, isAccept: true },
    ],
    edges: [
      { from: 'C', to: 'D', label: 'ε', kind: 'walk', curve: 'straight' },
      { from: 'D', to: 'E', label: 'a', kind: 'train', curve: 'straight' },
      { from: 'E', to: 'D', label: 'ε', kind: 'walk', curve: 'top' },
      { from: 'E', to: 'F', label: 'ε', kind: 'walk', curve: 'straight' },
      { from: 'C', to: 'F', label: 'ε', kind: 'walk', curve: 'bottom' },
    ],
    tableRows: [
      { state: 'C', onA: '∅', onB: '∅', onEps: 'D, F', ef: '∅ → 1' as '1' },
      { state: 'D', onA: 'E', onB: '∅', onEps: '∅', ef: '∅' },
      { state: 'E', onA: '∅', onB: '∅', onEps: 'D, F', ef: '∅ → 1' as '1' },
      { state: 'F', onA: '∅', onB: '∅', onEps: '∅', ef: '1' },
    ],
  },
  {
    id: 'plus',
    expression: 'a+',
    title: 'Cerradura Positiva (1 o más)',
    tag: 'Diferencia clave con a*',
    howToSpot: 'Tiene un signo más (+) arriba. Significa: mínimo UNA "a" obligatoria, y después las "a" extra que quieras.',
    metroAnalogy:
      'Igual que el bucle anterior, pero cerraron el atajo gratuito inferior: si quieres salir en F, primero debes pagar al menos un boleto "a".',
    diagramRule:
      'Dibuja el retorno superior E→D para repetir, pero ELIMINA el pasillo inferior C→F. Así nadie sale gratis sin viajar.',
    tableRule:
      'En la tabla, la estación de entrada C solo llega a D (no a F), por lo tanto C nunca se vuelve estado de aceptación.',
    differenceHighlight: 'La ÚNICA diferencia visual frente a a* es borrar la flecha inferior ε de salto directo.',
    validExamples: ['a', 'aa', 'aaaa'],
    invalidExamples: ['ε (vacía)', 'b', 'ab'],
    nodes: [
      { id: 'C', x: 90, y: 120, isStart: true },
      { id: 'D', x: 210, y: 120 },
      { id: 'E', x: 330, y: 120 },
      { id: 'F', x: 450, y: 120, isAccept: true },
    ],
    edges: [
      { from: 'C', to: 'D', label: 'ε', kind: 'walk', curve: 'straight' },
      { from: 'D', to: 'E', label: 'a', kind: 'train', curve: 'straight' },
      { from: 'E', to: 'D', label: 'ε', kind: 'walk', curve: 'top' },
      { from: 'E', to: 'F', label: 'ε', kind: 'walk', curve: 'straight' },
    ],
    tableRows: [
      { state: 'C', onA: '∅', onB: '∅', onEps: 'D', ef: '∅' },
      { state: 'D', onA: 'E', onB: '∅', onEps: '∅', ef: '∅' },
      { state: 'E', onA: '∅', onB: '∅', onEps: 'D, F', ef: '∅' },
      { state: 'F', onA: '∅', onB: '∅', onEps: '∅', ef: '1' },
    ],
  },
  {
    id: 'union',
    expression: 'a | b',
    title: 'Unión o Alternativa (O uno O el otro)',
    tag: 'Bloque de bifurcación',
    howToSpot: 'Tiene una barra vertical "|" (a veces escrita como + en medio: a+b). Significa: elige UNA sola ruta.',
    metroAnalogy:
      'En el vestíbulo de entrada S puedes caminar gratis hacia el andén superior (tren "a") o hacia el andén inferior (tren "b"). Ambos llegan a la misma salida F.',
    diagramRule:
      'Divide la vía en 2 ramas paralelas con ε de entrada (S→A, S→C) y 2 pasillos ε de unión al final (B→F, D→F).',
    tableRule:
      'La entrada S tendrá ε-C(S) = {S, A, C}, por lo que en la tabla AFN heredará tanto la salida de "a" como la de "b".',
    differenceHighlight: 'A diferencia de "ab" (en fila), "a|b" se dibuja en paralelo (uno arriba y otro abajo).',
    validExamples: ['a', 'b'],
    invalidExamples: ['ab', 'ba', 'aa', 'ε'],
    nodes: [
      { id: 'S', x: 85, y: 120, isStart: true },
      { id: 'A', x: 205, y: 60 },
      { id: 'B', x: 335, y: 60 },
      { id: 'C', x: 205, y: 180 },
      { id: 'D', x: 335, y: 180 },
      { id: 'F', x: 455, y: 120, isAccept: true },
    ],
    edges: [
      { from: 'S', to: 'A', label: 'ε', kind: 'walk', curve: 'straight' },
      { from: 'A', to: 'B', label: 'a', kind: 'train', curve: 'straight' },
      { from: 'B', to: 'F', label: 'ε', kind: 'walk', curve: 'straight' },
      { from: 'S', to: 'C', label: 'ε', kind: 'walk', curve: 'straight' },
      { from: 'C', to: 'D', label: 'b', kind: 'train', curve: 'straight' },
      { from: 'D', to: 'F', label: 'ε', kind: 'walk', curve: 'straight' },
    ],
    tableRows: [
      { state: 'S', onA: '∅', onB: '∅', onEps: 'A, C', ef: '∅' },
      { state: 'A', onA: 'B', onB: '∅', onEps: '∅', ef: '∅' },
      { state: 'B', onA: '∅', onB: '∅', onEps: 'F', ef: '∅' },
      { state: 'C', onA: '∅', onB: 'D', onEps: '∅', ef: '∅' },
      { state: 'D', onA: '∅', onB: '∅', onEps: 'F', ef: '∅' },
      { state: 'F', onA: '∅', onB: '∅', onEps: '∅', ef: '1' },
    ],
  },
  {
    id: 'optional',
    expression: 'a?',
    title: 'Opcional (0 o 1 sola vez)',
    tag: 'Diferencia clave con a*',
    howToSpot: 'Tiene un signo de interrogación (?). Significa: el boleto "a" es opcional, pero máximo una vez.',
    metroAnalogy:
      'Puedes tomar el tren "a" una vez o cruzar por el puente peatonal de abajo sin pagar, pero NO hay escalera para regresar y repetir.',
    diagramRule:
      'Igual que a*, tiene el atajo inferior C→F para saltar, pero SIN el arco superior E→D de regreso.',
    tableRule:
      'Después de pagar "a" llegas a E→F y ya no hay más transiciones salientes para "a".',
    differenceHighlight: 'Tiene el atajo inferior (como a*), pero NO tiene el bucle superior de regreso.',
    validExamples: ['ε (vacía)', 'a'],
    invalidExamples: ['aa', 'aaa', 'b'],
    nodes: [
      { id: 'C', x: 90, y: 120, isStart: true },
      { id: 'D', x: 210, y: 120 },
      { id: 'E', x: 330, y: 120 },
      { id: 'F', x: 450, y: 120, isAccept: true },
    ],
    edges: [
      { from: 'C', to: 'D', label: 'ε', kind: 'walk', curve: 'straight' },
      { from: 'D', to: 'E', label: 'a', kind: 'train', curve: 'straight' },
      { from: 'E', to: 'F', label: 'ε', kind: 'walk', curve: 'straight' },
      { from: 'C', to: 'F', label: 'ε', kind: 'walk', curve: 'bottom' },
    ],
    tableRows: [
      { state: 'C', onA: '∅', onB: '∅', onEps: 'D, F', ef: '∅' },
      { state: 'D', onA: 'E', onB: '∅', onEps: '∅', ef: '∅' },
      { state: 'E', onA: '∅', onB: '∅', onEps: 'F', ef: '∅' },
      { state: 'F', onA: '∅', onB: '∅', onEps: '∅', ef: '1' },
    ],
  },
  {
    id: 'exercise',
    expression: '(ab)a*',
    title: 'Tu Ejercicio A2: Bloque (ab) + Bloque a*',
    tag: 'Unión de bloques 1 y 2',
    howToSpot: 'Primero un paréntesis sin repetición (ab), pegado sin símbolo a una estrella de Kleene a*.',
    metroAnalogy:
      'Es simplemente pegar el mapa de "ab" (A→B→C) justo antes de la entrada C del mapa "a*" (C→D→E→F).',
    diagramRule:
      'El estado final C del bloque "ab" se fusiona como la entrada del bloque "a*", usando los pasillos ε para repetir o salir.',
    tableRule:
      'Por eso la tabla tiene 6 estaciones (A..F): las primeras 2 (A, B) vienen de "ab" y las últimas 4 (C, D, E, F) vienen de "a*".',
    differenceHighlight: 'No se inventa de memoria: se arma pegando el bloque Concatenación + el bloque Estrella de Kleene.',
    validExamples: ['ab', 'aba', 'abaa', 'abaaa'],
    invalidExamples: ['a', 'b', 'abb'],
    nodes: [
      { id: 'A', x: 55, y: 120, isStart: true },
      { id: 'B', x: 135, y: 120 },
      { id: 'C', x: 215, y: 120 },
      { id: 'D', x: 300, y: 120 },
      { id: 'E', x: 385, y: 120 },
      { id: 'F', x: 470, y: 120, isAccept: true },
    ],
    edges: [
      { from: 'A', to: 'B', label: 'a', kind: 'train', curve: 'straight' },
      { from: 'B', to: 'C', label: 'b', kind: 'train', curve: 'straight' },
      { from: 'C', to: 'D', label: 'ε', kind: 'walk', curve: 'straight' },
      { from: 'D', to: 'E', label: 'a', kind: 'train', curve: 'straight' },
      { from: 'E', to: 'D', label: 'ε', kind: 'walk', curve: 'top' },
      { from: 'E', to: 'F', label: 'ε', kind: 'walk', curve: 'straight' },
      { from: 'C', to: 'F', label: 'ε', kind: 'walk', curve: 'bottom' },
    ],
    tableRows: [
      { state: 'A', onA: 'B', onB: '∅', onEps: '∅', ef: '∅' },
      { state: 'B', onA: '∅', onB: 'C', onEps: '∅', ef: '∅' },
      { state: 'C', onA: '∅', onB: '∅', onEps: 'D, F', ef: '∅' },
      { state: 'D', onA: 'E', onB: '∅', onEps: '∅', ef: '∅' },
      { state: 'E', onA: '∅', onB: '∅', onEps: 'D, F', ef: '∅' },
      { state: 'F', onA: '∅', onB: '∅', onEps: '∅', ef: '1' },
    ],
  },
];
