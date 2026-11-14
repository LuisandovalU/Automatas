import {
  DFA_ORDER,
  DFA_STATIONS,
  IMAGE2_TABLE,
  NFA_STATIONS,
  NFA_TRANSITIONS,
  QUIZ_QUESTIONS,
  SLIDE_TEST_STRINGS,
} from '../data/automataData';
import { getStationVisualSpec } from '../data/cdmxLinesData';

export interface NfaTransitionSpec {
  id: string;
  from: string;
  to: string;
  label: string; // symbol in alphabet or 'ε'
  kind: 'train' | 'walk';
  explanation: string;
}

export interface NfaStationInfo {
  id: string;
  metroName: string;
  role: string;
  description: string;
  isStart: boolean;
  isOriginalAccept: boolean;
  isNewAccept: boolean;
  epsilonClosure: string[];
  closureReason: string;
  x: number;
  y: number;
}

export interface NfaSpec {
  id: string;
  title: string;
  regex?: string;
  sourceKind: 'preset' | 'regex' | 'custom-graph';
  difficulty: 'Base de Clase' | 'Básico' | 'Intermedio' | 'Examen';
  description: string;
  alphabet: string[];
  states: string[];
  startState: string;
  acceptStates: string[];
  transitions: NfaTransitionSpec[];
}

export interface Stage2SymbolCell {
  deltaList: string[];
  delta: string;
  closureList: string[];
  closure: string;
  why: string;
  whyExam: string;
}

export interface Stage2RowDynamic {
  state: string;
  epsilonCList: string[];
  epsilonC: string;
  bySymbol: Record<string, Stage2SymbolCell>;
  efOriginal: '∅' | '1';
  efNew: '∅' | '1';
  whyEF: string;
  closureReason: string;
}

export interface DfaSubsetRowDynamic {
  id: string;
  members: string[];
  transitions: Record<string, string>;
  unionBreakdown: Record<string, string>;
  ef: '∅' | '1';
  isStart: boolean;
  isDeadEnd: boolean;
  subtitle: string;
  whyExists: string;
  hintBySymbol: Record<string, string>;
  hintEF: string;
  x: number;
  y: number;
}

export interface MinimizedDfaState {
  id: string;
  originalIds: string[];
  transitions: Record<string, string>;
  ef: '∅' | '1';
  isStart: boolean;
  isDeadEnd: boolean;
}

export interface MinimizedDfaResult {
  states: MinimizedDfaState[];
  partitionsHistory: string[][];
  mergedCount: number;
  summary: string;
}

export interface TestCaseDynamic {
  text: string;
  expectedValid: boolean;
  label: string;
  reason: string;
}

export interface QuizQuestionDynamic {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LayoutNode2D {
  id: string;
  x: number;
  y: number;
  isStart: boolean;
  isAccept: boolean;
  isDeadEnd?: boolean;
  subtitle?: string;
}

export interface LayoutEdge2D {
  id: string;
  from: string;
  to: string;
  symbols: string[];
  label: string;
  kind: 'train' | 'walk' | 'dead';
  curve: 'straight' | 'top' | 'bottom' | 'self';
  curveOffset?: number;
}

export interface SolvedMethodBundle {
  spec: NfaSpec;
  stations: Record<string, NfaStationInfo>;
  stage2Rows: Stage2RowDynamic[];
  candidateSets: string[];
  dfaStartId: string;
  dfaOrder: string[];
  dfaRows: Record<string, DfaSubsetRowDynamic>;
  dfaHasTrapState: boolean;
  startHadEpsilonExpansion: boolean;
  minimizedDfa: MinimizedDfaResult;
  testCases: TestCaseDynamic[];
  quizQuestions: QuizQuestionDynamic[];
  nfaLayout: {
    width: number;
    height: number;
    nodes: LayoutNode2D[];
    edges: LayoutEdge2D[];
  };
  dfaLayout: {
    width: number;
    height: number;
    nodes: LayoutNode2D[];
    edges: LayoutEdge2D[];
  };
}

export interface NfaTraceStep {
  stepIndex: number;
  consumedSymbol: string;
  activeStates: string[];
  highlightedEdges: string[];
  narration: string;
}

export interface DfaTraceStep {
  step: number;
  symbol: string;
  state: string; // state id or 'INVALID_CHAR'
  edgeId: string | null;
  narration: string;
}

const CDMX_FALLBACK_STATIONS = [
  'Pantitlán',
  'Pino Suárez',
  'Tacubaya',
  'Chabacano',
  'Hidalgo',
  'Zócalo',
  'Bellas Artes',
  'Balderas',
  'Insurgentes',
  'Universidad',
  'Copilco',
  'Coyoacán',
  'Zapata',
  'Mixcoac',
  'Polanco',
  'Auditorio',
  'Chapultepec',
  'Sevilla',
  'Salto del Agua',
  'Doctores',
  'Obrera',
  'Jamaica',
  'San Lázaro',
  'Candelaria',
  'Morelos',
  'Consulado',
];

function formatSet(items: string[]): string {
  return items.length === 0 ? '∅' : items.join(',');
}

function getMetroTitleForState(specId: string, stateId: string, index: number): string {
  if (specId === 'a2-ab-astar' && stateId in NFA_STATIONS) {
    return NFA_STATIONS[stateId as keyof typeof NFA_STATIONS].metroName;
  }
  const spec = getStationVisualSpec(stateId);
  if (spec && spec.officialName && !spec.officialName.startsWith('Estación ')) {
    return spec.officialName.split('/')[0].trim();
  }
  return CDMX_FALLBACK_STATIONS[index % CDMX_FALLBACK_STATIONS.length];
}

// ============================================================================
// 1. REGEX PARSER & COMPACT THOMPSON AFN-ε BUILDER
// ============================================================================

interface RawEdge {
  from: number;
  to: number;
  label: string;
}

interface ThompsonFragment {
  start: number;
  end: number;
  edges: RawEdge[];
}

const REGEX_META = new Set(['(', ')', '|', '*', '+', '?']);

function tokenizeRegex(rawInput: string): string[] {
  const cleaned = rawInput.replace(/\s+/g, '').replace(/λ/g, 'ε');
  if (!cleaned) {
    throw new Error('Escribe una expresión regular (por ejemplo: (ab)a* o (a|b)*abb).');
  }

  const tokens: string[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === '\\') {
      if (i + 1 >= cleaned.length) {
        throw new Error('Carácter de escape "\\" incompleto al final de la expresión.');
      }
      tokens.push(cleaned[i + 1]);
      i++;
      continue;
    }
    tokens.push(ch);
  }
  return tokens;
}

function isAtomEnd(tok: string): boolean {
  return tok === ')' || tok === '*' || tok === '+' || tok === '?' || !REGEX_META.has(tok);
}

function isAtomStart(tok: string): boolean {
  return tok === '(' || !REGEX_META.has(tok);
}

function toPostfix(tokens: string[]): string[] {
  const withConcat: string[] = [];
  const CONCAT = '·';

  for (let i = 0; i < tokens.length; i++) {
    const curr = tokens[i];
    if (i > 0) {
      const prev = tokens[i - 1];
      if (isAtomEnd(prev) && isAtomStart(curr)) {
        withConcat.push(CONCAT);
      }
    }
    withConcat.push(curr);
  }

  const prec: Record<string, number> = {
    '|': 1,
    [CONCAT]: 2,
    '*': 3,
    '+': 3,
    '?': 3,
  };

  const output: string[] = [];
  const ops: string[] = [];

  for (const tok of withConcat) {
    if (!REGEX_META.has(tok) && tok !== CONCAT) {
      output.push(tok);
    } else if (tok === '(') {
      ops.push(tok);
    } else if (tok === ')') {
      while (ops.length > 0 && ops[ops.length - 1] !== '(') {
        output.push(ops.pop()!);
      }
      if (ops.length === 0 || ops[ops.length - 1] !== '(') {
        throw new Error('Hay un paréntesis ")" sin apertura "(".');
      }
      ops.pop();
    } else if (tok === '*' || tok === '+' || tok === '?') {
      // Unary postfix operators bind tightly and immediately emit
      while (ops.length > 0 && ops[ops.length - 1] !== '(' && prec[ops[ops.length - 1]] > prec[tok]) {
        output.push(ops.pop()!);
      }
      output.push(tok);
    } else {
      while (
        ops.length > 0 &&
        ops[ops.length - 1] !== '(' &&
        prec[ops[ops.length - 1]] >= prec[tok]
      ) {
        output.push(ops.pop()!);
      }
      ops.push(tok);
    }
  }

  while (ops.length > 0) {
    const op = ops.pop()!;
    if (op === '(' || op === ')') {
      throw new Error('Falta cerrar un paréntesis "(" en tu expresión.');
    }
    output.push(op);
  }

  return output;
}

export function buildNfaFromRegex(
  regexInput: string,
  options?: {
    id?: string;
    title?: string;
    description?: string;
    difficulty?: NfaSpec['difficulty'];
    alphabetOverride?: string[];
  }
): NfaSpec {
  const tokens = tokenizeRegex(regexInput);
  const postfix = toPostfix(tokens);

  let nextId = 0;
  const fresh = () => nextId++;
  const stack: ThompsonFragment[] = [];

  for (const tok of postfix) {
    if (tok === '·') {
      const f2 = stack.pop();
      const f1 = stack.pop();
      if (!f1 || !f2) {
        throw new Error('Concatenación inválida cerca de un operador.');
      }
      // Compact Thompson concatenation: merge f1.end (0 outgoing) with f2.start (0 incoming)
      const mergeOld = f2.start;
      const mergeNew = f1.end;
      const mappedF2Edges = f2.edges.map((e) => ({
        from: e.from === mergeOld ? mergeNew : e.from,
        to: e.to === mergeOld ? mergeNew : e.to,
        label: e.label,
      }));
      const endState = f2.end === mergeOld ? mergeNew : f2.end;
      stack.push({
        start: f1.start,
        end: endState,
        edges: [...f1.edges, ...mappedF2Edges],
      });
    } else if (tok === '|') {
      const f2 = stack.pop();
      const f1 = stack.pop();
      if (!f1 || !f2) {
        throw new Error('El operador de unión "|" necesita una expresión antes y otra después.');
      }
      const s = fresh();
      const e = fresh();
      stack.push({
        start: s,
        end: e,
        edges: [
          { from: s, to: f1.start, label: 'ε' },
          { from: s, to: f2.start, label: 'ε' },
          ...f1.edges,
          ...f2.edges,
          { from: f1.end, to: e, label: 'ε' },
          { from: f2.end, to: e, label: 'ε' },
        ],
      });
    } else if (tok === '*') {
      const f = stack.pop();
      if (!f) throw new Error('El operador "*" debe ir después de una letra o grupo.');
      const s = fresh();
      const e = fresh();
      stack.push({
        start: s,
        end: e,
        edges: [
          { from: s, to: f.start, label: 'ε' },
          ...f.edges,
          { from: f.end, to: f.start, label: 'ε' },
          { from: f.end, to: e, label: 'ε' },
          { from: s, to: e, label: 'ε' },
        ],
      });
    } else if (tok === '+') {
      const f = stack.pop();
      if (!f) throw new Error('El operador "+" debe ir después de una letra o grupo.');
      const s = fresh();
      const e = fresh();
      stack.push({
        start: s,
        end: e,
        edges: [
          { from: s, to: f.start, label: 'ε' },
          ...f.edges,
          { from: f.end, to: f.start, label: 'ε' },
          { from: f.end, to: e, label: 'ε' },
        ],
      });
    } else if (tok === '?') {
      const f = stack.pop();
      if (!f) throw new Error('El operador "?" debe ir después de una letra o grupo.');
      const s = fresh();
      const e = fresh();
      stack.push({
        start: s,
        end: e,
        edges: [
          { from: s, to: f.start, label: 'ε' },
          ...f.edges,
          { from: f.end, to: e, label: 'ε' },
          { from: s, to: e, label: 'ε' },
        ],
      });
    } else {
      const s = fresh();
      const e = fresh();
      stack.push({
        start: s,
        end: e,
        edges: [{ from: s, to: e, label: tok }],
      });
    }
  }

  if (stack.length !== 1) {
    throw new Error('No se pudo interpretar la expresión regular. Revisa paréntesis y operadores.');
  }

  const frag = stack[0];

  // Collect states in DFS spine order from frag.start
  const adj = new Map<number, RawEdge[]>();
  for (const edge of frag.edges) {
    const list = adj.get(edge.from) ?? [];
    list.push(edge);
    adj.set(edge.from, list);
  }

  const orderedRawStates: number[] = [];
  const visited = new Set<number>();
  const dfs = (u: number) => {
    if (visited.has(u)) return;
    visited.add(u);
    orderedRawStates.push(u);
    for (const edge of adj.get(u) ?? []) {
      dfs(edge.to);
    }
  };
  dfs(frag.start);
  if (!visited.has(frag.end)) {
    orderedRawStates.push(frag.end);
  }

  if (orderedRawStates.length > 26) {
    throw new Error(
      `La expresión generó ${orderedRawStates.length} estados (máximo 26 para mantener tablas claras). Simplifícala un poco.`
    );
  }

  // Detect alphabet symbols
  const symbolSet = new Set<string>();
  for (const edge of frag.edges) {
    if (edge.label !== 'ε') symbolSet.add(edge.label);
  }
  const alphabet = options?.alphabetOverride?.length
    ? Array.from(new Set(options.alphabetOverride))
    : symbolSet.size > 0
    ? Array.from(symbolSet).sort()
    : ['a', 'b'];

  const hasUpperConflict = alphabet.some((s) => /^[A-Z]$/.test(s));
  const rawToName = new Map<number, string>();
  orderedRawStates.forEach((rawId, idx) => {
    const name = hasUpperConflict ? `q${idx}` : String.fromCharCode(65 + idx);
    rawToName.set(rawId, name);
  });

  const states = orderedRawStates.map((r) => rawToName.get(r)!);
  const startState = rawToName.get(frag.start)!;
  const acceptStates = [rawToName.get(frag.end)!];

  const normalizedRegex = regexInput.replace(/\s+/g, '');
  const isExerciseA2 =
    options?.id === 'a2-ab-astar' || normalizedRegex === '(ab)a*' || normalizedRegex === 'aba*';

  const seenEdgeKey = new Set<string>();
  const transitions: NfaTransitionSpec[] = [];

  for (const edge of frag.edges) {
    const from = rawToName.get(edge.from);
    const to = rawToName.get(edge.to);
    if (!from || !to) continue;
    const label = edge.label;
    const dedup = `${from}->${to}:${label}`;
    if (seenEdgeKey.has(dedup)) continue;
    seenEdgeKey.add(dedup);

    const isWalk = label === 'ε';
    const edgeId = `${from}-${isWalk ? 'e' : label}-${to}`;

    let explanation = isWalk
      ? `Pasillo gratis (ε): caminas de ${from} a ${to} sin pagar boleto.`
      : `Tren "${label}": avanza de la estación ${from} hacia ${to}.`;

    if (isExerciseA2) {
      const preset = NFA_TRANSITIONS.find((t) => t.id === edgeId);
      if (preset) explanation = preset.explanation;
    }

    transitions.push({
      id: edgeId,
      from,
      to,
      label,
      kind: isWalk ? 'walk' : 'train',
      explanation,
    });
  }

  return {
    id: options?.id ?? `regex-${normalizedRegex}`,
    title: options?.title ?? `Expresión Regular: ${normalizedRegex}`,
    regex: normalizedRegex,
    sourceKind: options?.id === 'a2-ab-astar' ? 'preset' : 'regex',
    difficulty: options?.difficulty ?? 'Intermedio',
    description:
      options?.description ??
      `Conversión completa paso a paso para ${normalizedRegex} sobre el alfabeto Σ = {${alphabet.join(', ')}}.`,
    alphabet,
    states,
    startState,
    acceptStates,
    transitions,
  };
}

// ============================================================================
// 2. EXACT 4-SLIDE METHOD SOLVER (FOR ANY AFN-ε)
// ============================================================================

function computeEpsilonClosure(
  seeds: string[],
  transitions: NfaTransitionSpec[],
  _stateOrder: string[]
): string[] {
  const result: string[] = [];
  const visited = new Set<string>();
  const queue: string[] = [];

  for (const s of seeds) {
    if (!visited.has(s)) {
      visited.add(s);
      result.push(s);
      queue.push(s);
    }
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const tr of transitions) {
      if (tr.from === curr && tr.label === 'ε' && !visited.has(tr.to)) {
        visited.add(tr.to);
        result.push(tr.to);
        queue.push(tr.to);
      }
    }
  }

  return result;
}

function canonicalSetKey(members: string[], stateOrder: string[]): string {
  if (members.length === 0) return '∅';
  const unique = Array.from(new Set(members));
  unique.sort((a, b) => {
    const ia = stateOrder.indexOf(a);
    const ib = stateOrder.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  return unique.join(',');
}

function minimizeDfa(
  dfaOrder: string[],
  dfaRows: Record<string, DfaSubsetRowDynamic>,
  alphabet: string[],
  startId: string
): MinimizedDfaResult {
  const acceptGroup = dfaOrder.filter((id) => dfaRows[id].ef === '1');
  const nonAcceptGroup = dfaOrder.filter((id) => dfaRows[id].ef !== '1');

  let partition: string[][] = [];
  if (nonAcceptGroup.length > 0) partition.push(nonAcceptGroup);
  if (acceptGroup.length > 0) partition.push(acceptGroup);

  const partitionsHistory: string[][] = [partition.map((g) => `{${g.join(' ')}}`)];

  let changed = true;
  let guard = 0;
  while (changed && guard < 40) {
    changed = false;
    guard++;

    const groupOf = new Map<string, number>();
    partition.forEach((grp, idx) => {
      grp.forEach((st) => groupOf.set(st, idx));
    });

    const nextPartition: string[][] = [];
    for (const grp of partition) {
      if (grp.length <= 1) {
        nextPartition.push(grp);
        continue;
      }
      const buckets = new Map<string, string[]>();
      for (const st of grp) {
        const sig = alphabet
          .map((sym) => {
            const target = dfaRows[st].transitions[sym];
            return String(groupOf.get(target) ?? -1);
          })
          .join('|');
        const list = buckets.get(sig) ?? [];
        list.push(st);
        buckets.set(sig, list);
      }
      if (buckets.size > 1) changed = true;
      for (const sub of buckets.values()) {
        nextPartition.push(sub);
      }
    }
    partition = nextPartition;
    if (changed) {
      partitionsHistory.push(partition.map((g) => `{${g.join(' ')}}`));
    }
  }

  // Reorder so start group comes first, dead group stays cleanly labeled
  const startGroupIdx = partition.findIndex((g) => g.includes(startId));
  if (startGroupIdx > 0) {
    const [sGrp] = partition.splice(startGroupIdx, 1);
    partition.unshift(sGrp);
  }

  const stateToMinId = new Map<string, string>();
  partition.forEach((grp, idx) => {
    const id =
      grp.length === 1
        ? grp[0]
        : `M${idx + 1} (${grp.join(' ≡ ')})`;
    grp.forEach((s) => stateToMinId.set(s, id));
  });

  const states: MinimizedDfaState[] = partition.map((grp) => {
    const rep = grp[0];
    const repRow = dfaRows[rep];
    const id = stateToMinId.get(rep)!;
    const transitions: Record<string, string> = {};
    for (const sym of alphabet) {
      transitions[sym] = stateToMinId.get(repRow.transitions[sym])!;
    }
    return {
      id,
      originalIds: grp,
      transitions,
      ef: repRow.ef,
      isStart: grp.includes(startId),
      isDeadEnd: grp.every((g) => dfaRows[g].isDeadEnd),
    };
  });

  const mergedCount = dfaOrder.length - states.length;
  const summary =
    mergedCount === 0
      ? `Este AFD ya es mínimo (${states.length} estados): ninguna pareja de estados tiene comportamiento idéntico.`
      : `Se redujo de ${dfaOrder.length} a ${states.length} estados al fusionar ${mergedCount} estado(s) equivalente(s) con salidas idénticas.`;

  return {
    states,
    partitionsHistory,
    mergedCount,
    summary,
  };
}

function generateAutoTestCases(
  spec: NfaSpec,
  dfaOrder: string[],
  dfaRows: Record<string, DfaSubsetRowDynamic>,
  dfaStartId: string
): TestCaseDynamic[] {
  if (spec.id === 'a2-ab-astar') {
    return SLIDE_TEST_STRINGS;
  }

  const accepted: TestCaseDynamic[] = [];
  const rejected: TestCaseDynamic[] = [];
  const seenAccepted = new Set<string>();
  const seenRejected = new Set<string>();

  // Check empty string ε
  if (dfaRows[dfaStartId].ef === '1') {
    accepted.push({
      text: '',
      expectedValid: true,
      label: 'ε (vacía)',
      reason: `El estado inicial ${dfaStartId} ya tiene EF = 1, así que la cadena vacía ε se acepta sin leer boletos.`,
    });
    seenAccepted.add('');
  } else {
    rejected.push({
      text: '',
      expectedValid: false,
      label: 'ε (vacía)',
      reason: `El estado inicial ${dfaStartId} tiene EF = ∅; necesitas al menos un boleto para llegar a una salida válida.`,
    });
    seenRejected.add('');
  }

  // BFS over DFA strings (up to length 6) to gather clear accepted & rejected samples
  const queue: { state: string; str: string }[] = [{ state: dfaStartId, str: '' }];
  const stateVisitCount = new Map<string, number>();

  while (queue.length > 0 && (accepted.length < 5 || rejected.length < 3)) {
    const curr = queue.shift()!;
    if (curr.str.length >= 6) continue;

    for (const sym of spec.alphabet) {
      const nextSt = dfaRows[curr.state].transitions[sym];
      const nextStr = curr.str + sym;
      const row = dfaRows[nextSt];

      if (row.ef === '1' && !seenAccepted.has(nextStr) && accepted.length < 5) {
        seenAccepted.add(nextStr);
        accepted.push({
          text: nextStr,
          expectedValid: true,
          label: nextStr,
          reason: `Al leer "${nextStr}" terminas en ${nextSt}, que tiene salida válida (EF = 1).`,
        });
      } else if (row.ef !== '1' && !seenRejected.has(nextStr) && rejected.length < 3) {
        seenRejected.add(nextStr);
        rejected.push({
          text: nextStr,
          expectedValid: false,
          label: nextStr,
          reason: row.isDeadEnd
            ? `Al leer "${nextStr}" el tren cae en la Vía Muerta [∅] sin retorno.`
            : `Al leer "${nextStr}" quedas en ${nextSt}, que aún no es salida válida (EF = ∅).`,
        });
      }

      const visits = stateVisitCount.get(nextSt) ?? 0;
      if (visits < 3 && nextStr.length < 5) {
        stateVisitCount.set(nextSt, visits + 1);
        queue.push({ state: nextSt, str: nextStr });
      }
    }
  }

  // Add an invalid-alphabet test string just like "abas" in Slide 4
  const foreignChar = ['s', 'x', 'z', '9'].find((c) => !spec.alphabet.includes(c)) ?? '?';
  const sampleBase = accepted.find((a) => a.text.length > 0)?.text ?? spec.alphabet[0] ?? 'a';
  const foreignStr = `${sampleBase}${foreignChar}`;
  if (rejected.length < 4) {
    rejected.push({
      text: foreignStr,
      expectedValid: false,
      label: foreignStr,
      reason: `Contiene "${foreignChar}", un símbolo que no existe en el alfabeto Σ = {${spec.alphabet.join(', ')}}.`,
    });
  }

  return [...accepted, ...rejected];
}

function generateAutoQuiz(
  spec: NfaSpec,
  stage2Rows: Stage2RowDynamic[],
  dfaOrder: string[],
  dfaRows: Record<string, DfaSubsetRowDynamic>,
  dfaStartId: string
): QuizQuestionDynamic[] {
  if (spec.id === 'a2-ab-astar') {
    return QUIZ_QUESTIONS;
  }

  const questions: QuizQuestionDynamic[] = [];

  // Q1: Epsilon closure of an interesting state (prefer one with > 1 states in ε-C)
  const interestingEcRow =
    stage2Rows.find((r) => r.epsilonCList.length > 1) ?? stage2Rows[0];
  if (interestingEcRow) {
    const correct = `{${interestingEcRow.epsilonC}}`;
    const distractors = Array.from(
      new Set([
        '∅',
        `{${interestingEcRow.state}}`,
        `{${spec.states.slice(0, 2).join(',')}}`,
        `{${spec.states.join(',')}}`,
      ])
    ).filter((d) => d !== correct);
    const opts = [correct, ...distractors.slice(0, 3)].sort();
    questions.push({
      id: 'auto-q1',
      prompt: `En este autómata (${spec.title}), ¿cuánto vale la cerradura épsilon ε-C(${interestingEcRow.state})?`,
      options: opts,
      correctIndex: opts.indexOf(correct),
      explanation: interestingEcRow.closureReason,
    });
  }

  // Q2: EF nuevo inheritance
  const inheritedEfRow =
    stage2Rows.find((r) => r.efOriginal === '∅' && r.efNew === '1') ?? stage2Rows[0];
  if (inheritedEfRow) {
    const hasInherited = inheritedEfRow.efOriginal === '∅' && inheritedEfRow.efNew === '1';
    questions.push({
      id: 'auto-q2',
      prompt: hasInherited
        ? `¿Por qué la fila ${inheritedEfRow.state} cambia su EF de ∅ a 1 en la tabla AFN?`
        : `¿Qué revisas para saber si una fila x tiene EF nuevo = 1 al quitar las ε?`,
      options: hasInherited
        ? [
            `Porque su ε-C(${inheritedEfRow.state})={${inheritedEfRow.epsilonC}} contiene una salida original (${spec.acceptStates.join(',')}).`,
            'Porque todas las filas con letra vocal valen 1.',
            'Porque tiene una transición de regreso.',
            'Porque es la última letra del alfabeto.',
          ]
        : [
            'Si su columna 1 (ε-C) contiene al menos un estado final original.',
            'Si todas sus transiciones van a ∅.',
            'Si es el primer estado del grafo.',
            'Si no tiene flechas entrantes.',
          ],
      correctIndex: 0,
      explanation: inheritedEfRow.whyEF,
    });
  }

  // Q3: Subset construction start or trap state
  const trapRow = dfaOrder.find((id) => dfaRows[id].isDeadEnd);
  if (trapRow) {
    questions.push({
      id: 'auto-q3',
      prompt: `¿Por qué aparece la fila [∅] en la tabla AFD de ${spec.regex ?? spec.title}?`,
      options: [
        'Porque un AFD debe definir a dónde ir ante CUALQUIER símbolo del alfabeto, incluso los inválidos.',
        'Porque es el estado inicial obligatorio.',
        'Para aceptar la cadena vacía ε.',
        'Porque sobró espacio en la tabla.',
      ],
      correctIndex: 0,
      explanation:
        'Un AFD es completo: cuando en un súper-estado un símbolo da ∅ en la tabla AFN, lo enviamos a la Vía Muerta [∅] que se queda atrapada en sí misma.',
    });
  }

  // Q4: Accepting DFA subset check
  const accDfa = dfaOrder.find((id) => dfaRows[id].ef === '1');
  if (accDfa) {
    questions.push({
      id: 'auto-q4',
      prompt: `En el AFD final, ¿por qué ${accDfa} tiene salida válida (EF = 1)?`,
      options: [
        `Porque contiene al menos un estado de aceptación dentro de su conjunto (${dfaRows[accDfa].members.filter((m) => spec.acceptStates.includes(m)).join(', ') || 'EF=1'}).`,
        `Porque empieza desde ${dfaStartId}.`,
        'Porque todas sus flechas apuntan a sí mismo.',
        'Porque tiene más de 2 letras.',
      ],
      correctIndex: 0,
      explanation: dfaRows[accDfa].hintEF,
    });
  }

  return questions;
}

// ============================================================================
// 3. 2D AUTO-LAYOUT FOR ANY NFA & DFA
// ============================================================================

function computeNfaLayout(
  spec: NfaSpec,
  stations: Record<string, NfaStationInfo>
): SolvedMethodBundle['nfaLayout'] {
  if (spec.id === 'a2-ab-astar') {
    const nodes: LayoutNode2D[] = spec.states.map((id) => {
      const st = stations[id];
      return {
        id,
        x: st.x,
        y: st.y,
        isStart: st.isStart,
        isAccept: st.isOriginalAccept,
      };
    });
    const edges: LayoutEdge2D[] = spec.transitions.map((t) => {
      let curve: LayoutEdge2D['curve'] = 'straight';
      if (t.from === 'E' && t.to === 'D') curve = 'top';
      else if (t.from === 'C' && t.to === 'F') curve = 'bottom';
      return {
        id: t.id,
        from: t.from,
        to: t.to,
        symbols: [t.label],
        label: t.label,
        kind: t.kind,
        curve,
      };
    });
    return { width: 920, height: 330, nodes, edges };
  }

  // Layered BFS layout by shortest path distance from startState
  const rank = new Map<string, number>();
  rank.set(spec.startState, 0);
  const q = [spec.startState];
  while (q.length > 0) {
    const curr = q.shift()!;
    const r = rank.get(curr)!;
    for (const tr of spec.transitions) {
      if (tr.from === curr && !rank.has(tr.to)) {
        rank.set(tr.to, r + 1);
        q.push(tr.to);
      }
    }
  }
  // Ensure disconnected states get a rank too
  for (const s of spec.states) {
    if (!rank.has(s)) rank.set(s, rank.size);
  }

  const byRank = new Map<number, string[]>();
  for (const s of spec.states) {
    const r = rank.get(s) ?? 0;
    const list = byRank.get(r) ?? [];
    list.push(s);
    byRank.set(r, list);
  }

  const maxRank = Math.max(...Array.from(byRank.keys()), 0);
  const maxPerRank = Math.max(...Array.from(byRank.values()).map((v) => v.length), 1);

  const width = Math.max(820, 210 + (maxRank + 1) * 155);
  const height = Math.max(360, 190 + maxPerRank * 115);

  const nodes: LayoutNode2D[] = [];
  const nodePos = new Map<string, { x: number; y: number }>();

  const sortedRanks = Array.from(byRank.keys()).sort((a, b) => a - b);
  sortedRanks.forEach((r, rIdx) => {
    const group = byRank.get(r)!;
    const x =
      sortedRanks.length === 1
        ? width / 2
        : 105 + (rIdx / Math.max(1, sortedRanks.length - 1)) * (width - 210);
    group.forEach((stId, idx) => {
      const y =
        group.length === 1
          ? height / 2
          : height / 2 + (idx - (group.length - 1) / 2) * 115;
      nodePos.set(stId, { x, y });
      stations[stId].x = x;
      stations[stId].y = y;
      nodes.push({
        id: stId,
        x,
        y,
        isStart: stId === spec.startState,
        isAccept: spec.acceptStates.includes(stId),
      });
    });
  });

  // Group parallel edges between same (from, to, kind) or separate back/skip edges
  const edges: LayoutEdge2D[] = spec.transitions.map((tr) => {
    const pFrom = nodePos.get(tr.from)!;
    const pTo = nodePos.get(tr.to)!;
    const span = Math.abs(pTo.x - pFrom.x);
    let curve: LayoutEdge2D['curve'] = 'straight';
    let curveOffset = 0;

    if (tr.from === tr.to) {
      curve = 'self';
    } else if (pFrom.x > pTo.x) {
      curve = 'top';
      curveOffset = Math.min(115, 62 + span * 0.14);
    } else if (
      Math.abs(pFrom.y - pTo.y) < 18 &&
      span > 170
    ) {
      curve = 'bottom';
      curveOffset = Math.min(120, 68 + span * 0.14);
    }
    return {
      id: tr.id,
      from: tr.from,
      to: tr.to,
      symbols: [tr.label],
      label: tr.label,
      kind: tr.kind,
      curve,
      curveOffset,
    };
  });

  return { width, height, nodes, edges };
}

function computeDfaLayout(
  spec: NfaSpec,
  dfaOrder: string[],
  dfaRows: Record<string, DfaSubsetRowDynamic>
): SolvedMethodBundle['dfaLayout'] {
  if (spec.id === 'a2-ab-astar') {
    const nodes: LayoutNode2D[] = dfaOrder.map((id) => {
      const r = dfaRows[id];
      return {
        id,
        x: r.x,
        y: r.y,
        isStart: r.isStart,
        isAccept: r.ef === '1',
        isDeadEnd: r.isDeadEnd,
        subtitle: r.subtitle,
      };
    });
    const edges = buildGroupedDfaEdges(spec.alphabet, dfaOrder, dfaRows, nodes);
    return { width: 920, height: 490, nodes, edges };
  }

  const width = 940;
  const height = 500;
  const nonDead = dfaOrder.filter((id) => !dfaRows[id].isDeadEnd);
  const dead = dfaOrder.find((id) => dfaRows[id].isDeadEnd);

  const nodes: LayoutNode2D[] = [];
  if (nonDead.length <= 2) {
    nonDead.forEach((id, idx) => {
      const x = nonDead.length === 1 ? 470 : 250 + idx * 420;
      const y = dead ? 160 : 245;
      dfaRows[id].x = x;
      dfaRows[id].y = y;
      nodes.push({
        id,
        x,
        y,
        isStart: dfaRows[id].isStart,
        isAccept: dfaRows[id].ef === '1',
        isDeadEnd: false,
        subtitle: dfaRows[id].subtitle,
      });
    });
  } else if (nonDead.length === 3) {
    const coords = [
      { x: 205, y: dead ? 155 : 255 },
      { x: 470, y: dead ? 115 : 145 },
      { x: 735, y: dead ? 155 : 255 },
    ];
    nonDead.forEach((id, idx) => {
      const { x, y } = coords[idx];
      dfaRows[id].x = x;
      dfaRows[id].y = y;
      nodes.push({
        id,
        x,
        y,
        isStart: dfaRows[id].isStart,
        isAccept: dfaRows[id].ef === '1',
        isDeadEnd: false,
        subtitle: dfaRows[id].subtitle,
      });
    });
  } else if (nonDead.length === 4 && dead) {
    // Classic 4-corner stadium around central trap state [∅] (like Slide 4)
    const coords = [
      { x: 250, y: 120 },
      { x: 690, y: 120 },
      { x: 720, y: 380 },
      { x: 220, y: 380 },
    ];
    nonDead.forEach((id, idx) => {
      const { x, y } = coords[idx];
      dfaRows[id].x = x;
      dfaRows[id].y = y;
      nodes.push({
        id,
        x,
        y,
        isStart: dfaRows[id].isStart,
        isAccept: dfaRows[id].ef === '1',
        isDeadEnd: false,
        subtitle: dfaRows[id].subtitle,
      });
    });
  } else {
    // Arrange non-dead states on a well-proportioned stadium ellipse
    const cx = 470;
    const cy = dead ? 210 : 250;
    const rx = Math.min(340, 220 + nonDead.length * 24);
    const ry = dead ? 135 : 165;
    nonDead.forEach((id, idx) => {
      const angle = Math.PI + (idx / nonDead.length) * Math.PI * 2;
      const x = Math.round(cx + Math.cos(angle) * rx);
      const y = Math.round(cy + Math.sin(angle) * ry);
      dfaRows[id].x = x;
      dfaRows[id].y = y;
      nodes.push({
        id,
        x,
        y,
        isStart: dfaRows[id].isStart,
        isAccept: dfaRows[id].ef === '1',
        isDeadEnd: false,
        subtitle: dfaRows[id].subtitle,
      });
    });
  }

  if (dead) {
    const x = 470;
    const y = nonDead.length === 4 ? 250 : 405;
    dfaRows[dead].x = x;
    dfaRows[dead].y = y;
    nodes.push({
      id: dead,
      x,
      y,
      isStart: dfaRows[dead].isStart,
      isAccept: false,
      isDeadEnd: true,
      subtitle: dfaRows[dead].subtitle,
    });
  }

  const edges = buildGroupedDfaEdges(spec.alphabet, dfaOrder, dfaRows, nodes);
  return { width, height, nodes, edges };
}

function pointToSegmentDist(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { dist: number; side: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-4) return { dist: Math.hypot(px - x1, py - y1), side: 1 };
  const t = Math.max(0.12, Math.min(0.88, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  const cross = dx * (py - y1) - dy * (px - x1);
  return {
    dist: Math.hypot(px - projX, py - projY),
    side: cross >= 0 ? 1 : -1,
  };
}

function buildGroupedDfaEdges(
  alphabet: string[],
  dfaOrder: string[],
  dfaRows: Record<string, DfaSubsetRowDynamic>,
  nodes: LayoutNode2D[]
): LayoutEdge2D[] {
  const pairSymbols = new Map<string, { from: string; to: string; symbols: string[] }>();

  for (const from of dfaOrder) {
    const row = dfaRows[from];
    for (const sym of alphabet) {
      const to = row.transitions[sym];
      const key = `${from}=>${to}`;
      const existing = pairSymbols.get(key) ?? { from, to, symbols: [] };
      existing.symbols.push(sym);
      pairSymbols.set(key, existing);
    }
  }

  const edges: LayoutEdge2D[] = [];
  for (const entry of pairSymbols.values()) {
    const hasReverse = pairSymbols.has(`${entry.to}=>${entry.from}`) && entry.from !== entry.to;
    const isDeadTarget = entry.to === '[∅]';
    const curve: LayoutEdge2D['curve'] =
      entry.from === entry.to ? 'self' : hasReverse ? 'top' : 'straight';

    const fromNode = nodes.find((n) => n.id === entry.from);
    const toNode = nodes.find((n) => n.id === entry.to);
    let curveOffset = hasReverse ? 44 : 0;

    if (fromNode && toNode && entry.from !== entry.to) {
      // Check if segment passes close to any intermediate station box; if so, bend cleanly around it
      for (const other of nodes) {
        if (other.id === entry.from || other.id === entry.to) continue;
        const { dist, side } = pointToSegmentDist(
          other.x,
          other.y,
          fromNode.x,
          fromNode.y,
          toNode.x,
          toNode.y
        );
        if (dist < 76) {
          curveOffset = -side * Math.max(58, Math.abs(curveOffset));
          break;
        }
      }
      const span = Math.hypot(toNode.x - fromNode.x, toNode.y - fromNode.y);
      if (curveOffset === 0 && span > 460) {
        curveOffset = fromNode.y <= toNode.y ? 36 : -36;
      }
    }

    edges.push({
      id: `${entry.from}-${entry.symbols.join(',')}-${entry.to}`,
      from: entry.from,
      to: entry.to,
      symbols: entry.symbols,
      label: entry.symbols.join(', '),
      kind: isDeadTarget ? 'dead' : 'train',
      curve,
      curveOffset,
    });
  }

  return edges;
}

// ============================================================================
// 4. MASTER SOLVER ENTRYPOINT
// ============================================================================

export function solveAutomatonMethod(spec: NfaSpec): SolvedMethodBundle {
  const isExerciseA2 = spec.id === 'a2-ab-astar';

  // Step 1: Build Stage 2 rows (1. ε-C | 2. δ(x, σ) | 3. ε-C(δ) | EF orig | EF nuevo)
  const stage2Rows: Stage2RowDynamic[] = [];
  const stations: Record<string, NfaStationInfo> = {};
  const candidateSetValues = new Set<string>(['∅']);

  spec.states.forEach((st, idx) => {
    candidateSetValues.add(st);
    const ec = computeEpsilonClosure([st], spec.transitions, spec.states);
    const ecStr = formatSet(ec);
    candidateSetValues.add(ecStr);

    const efOriginal: '∅' | '1' = spec.acceptStates.includes(st) ? '1' : '∅';
    const reachedAccepts = ec.filter((q) => spec.acceptStates.includes(q));
    const efNew: '∅' | '1' = reachedAccepts.length > 0 ? '1' : '∅';

    const bySymbol: Record<string, Stage2SymbolCell> = {};
    for (const sym of spec.alphabet) {
      const deltaList: string[] = [];
      const deltaSeen = new Set<string>();
      for (const member of ec) {
        for (const tr of spec.transitions) {
          if (tr.from === member && tr.label === sym && !deltaSeen.has(tr.to)) {
            deltaSeen.add(tr.to);
            deltaList.push(tr.to);
          }
        }
      }

      const closureList =
        deltaList.length === 0
          ? []
          : computeEpsilonClosure(deltaList, spec.transitions, spec.states);

      const deltaStr = formatSet(deltaList);
      const closureStr = formatSet(closureList);
      candidateSetValues.add(deltaStr);
      candidateSetValues.add(closureStr);

      let why = '';
      let whyExam = '';
      if (isExerciseA2 && (sym === 'a' || sym === 'b')) {
        const presetRow = IMAGE2_TABLE.find((r) => r.state === st);
        if (presetRow) {
          why = sym === 'a' ? presetRow.whyA : presetRow.whyB;
        }
      }

      if (!why) {
        if (deltaList.length === 0) {
          why = `Desde ${st} caminas gratis a {${ecStr}}, pero ninguno de esos andenes tiene tren "${sym}". Resultado: ∅.`;
        } else {
          const extraViaEps = closureList.filter((q) => !deltaList.includes(q));
          why =
            extraViaEps.length > 0
              ? `En ${st} alcanzas gratis {${ecStr}}. Con boleto "${sym}" llegas a {${deltaStr}}, y al bajar caminas gratis por ε hasta {${closureStr}}.`
              : `En ${st} alcanzas gratis {${ecStr}}. Con boleto "${sym}" llegas a {${deltaStr}}, y ahí no hay pasillos gratis ε: quedas en {${closureStr}}.`;
        }
      }

      whyExam = `ε-C(${st})={${ecStr}} → δ({${ecStr}}, ${sym})={${deltaStr}} → ε-C({${deltaStr}})={${closureStr}}.`;

      bySymbol[sym] = {
        deltaList,
        delta: deltaStr,
        closureList,
        closure: closureStr,
        why,
        whyExam,
      };
    }

    const presetRow = isExerciseA2 ? IMAGE2_TABLE.find((r) => r.state === st) : undefined;
    const presetMeta = isExerciseA2 ? NFA_STATIONS[st as keyof typeof NFA_STATIONS] : undefined;

    const closureReason =
      presetMeta?.closureReason ??
      (ec.length > 1
        ? `Desde ${st} puedes quedarte en ${st} o caminar gratis por los pasillos ε hasta {${ecStr}}.`
        : `De ${st} no sale ningún pasillo gratis (ε). Sin boleto te quedas únicamente en ${st}.`);

    const whyEF =
      presetRow?.whyEF ??
      (efOriginal === '1'
        ? `${st} ya era una salida original (1).`
        : efNew === '1'
        ? `¡Cambia a 1! Aunque ${st} no era meta original, su ε-C={${ecStr}} llega gratis a la salida ${reachedAccepts.join(', ')}.`
        : `Desde ${st} (ε-C={${ecStr}}) no alcanzas ninguna salida original sin pagar boleto (∅).`);

    stage2Rows.push({
      state: st,
      epsilonCList: ec,
      epsilonC: ecStr,
      bySymbol,
      efOriginal,
      efNew,
      whyEF,
      closureReason,
    });

    stations[st] = {
      id: st,
      metroName: getMetroTitleForState(spec.id, st, idx),
      role:
        presetMeta?.role ??
        (st === spec.startState
          ? 'Estación Inicial'
          : spec.acceptStates.includes(st)
          ? 'Torniquete de Salida'
          : ec.length > 1
          ? 'Transbordo Gratis ε'
          : 'Andén Intermedio'),
      description:
        presetMeta?.description ??
        (st === spec.startState
          ? `Punto de partida de ${spec.title}. Todo pasajero entra por aquí.`
          : spec.acceptStates.includes(st)
          ? 'Estación de aceptación. Si terminas tus boletos aquí, el viaje es válido.'
          : ec.length > 1
          ? `Desde aquí puedes caminar gratis por pasillos ε hacia {${ecStr}}.`
          : `Estación intermedia dentro del recorrido de ${spec.title}.`),
      isStart: st === spec.startState,
      isOriginalAccept: efOriginal === '1',
      isNewAccept: efNew === '1',
      epsilonClosure: ec,
      closureReason,
      x: presetMeta?.x ?? 100 + idx * 140,
      y: presetMeta?.y ?? 180,
    };
  });

  // Step 2: Stage 3 Subset Construction in exact BFS order with explicit [∅] trap state
  const rowByState = Object.fromEntries(stage2Rows.map((r) => [r.state, r]));
  const startClosure = rowByState[spec.startState].epsilonCList;
  const startKey = canonicalSetKey(startClosure, spec.states);
  const dfaStartId = `[${startClosure.join(',')}]`;

  const keyToDisplayId = new Map<string, string>();
  keyToDisplayId.set(startKey, dfaStartId);

  const dfaOrder: string[] = [];
  const dfaRows: Record<string, DfaSubsetRowDynamic> = {};
  const discoveredBy = new Map<string, string>();
  discoveredBy.set(
    dfaStartId,
    startClosure.length > 1
      ? `El inicio ${spec.startState} tiene pasillos ε gratis hacia {${startClosure.join(',')}}, por eso el AFD arranca fusionando todo en ${dfaStartId}.`
      : `Todo viaje empieza únicamente en ${spec.startState} (ε-C(${spec.startState}) = {${spec.startState}}).`
  );

  const bfsQueue: { displayId: string; members: string[]; isDead: boolean }[] = [
    { displayId: dfaStartId, members: startClosure, isDead: false },
  ];
  const processedIds = new Set<string>();
  let dfaHasTrapState = false;

  while (bfsQueue.length > 0 && dfaOrder.length < 32) {
    const curr = bfsQueue.shift()!;
    if (processedIds.has(curr.displayId)) continue;
    processedIds.add(curr.displayId);
    dfaOrder.push(curr.displayId);

    const transitions: Record<string, string> = {};
    const unionBreakdown: Record<string, string> = {};
    const hintBySymbol: Record<string, string> = {};

    if (curr.isDead) {
      for (const sym of spec.alphabet) {
        transitions[sym] = '[∅]';
        unionBreakdown[sym] = '∅';
        hintBySymbol[sym] = `Si ya caíste a Vía Muerta [∅], cualquier "${sym}" te deja atrapado en [∅].`;
      }
      const presetDfa = isExerciseA2 ? DFA_STATIONS['[∅]'] : undefined;
      dfaRows[curr.displayId] = {
        id: '[∅]',
        members: [],
        transitions,
        unionBreakdown,
        ef: '∅',
        isStart: false,
        isDeadEnd: true,
        subtitle: presetDfa?.subtitle ?? 'Boleto inválido · Sin retorno',
        whyExists:
          presetDfa?.whyExists ??
          'Un AFD debe responder ante CUALQUIER boleto. Si no existe vía válida, te manda a este taller sin retorno.',
        hintBySymbol,
        hintEF: 'El conjunto vacío jamás contiene ninguna salida válida → EF = ∅.',
        x: presetDfa?.x ?? 455,
        y: presetDfa?.y ?? 395,
      };
      continue;
    }

    for (const sym of spec.alphabet) {
      const unionMembers: string[] = [];
      const unionSeen = new Set<string>();
      const partStrings: string[] = [];

      for (const m of curr.members) {
        const cell = rowByState[m].bySymbol[sym];
        partStrings.push(`${m}(${sym})=${cell.closure}`);
        for (const target of cell.closureList) {
          if (!unionSeen.has(target)) {
            unionSeen.add(target);
            unionMembers.push(target);
          }
        }
      }

      const targetKey = canonicalSetKey(unionMembers, spec.states);
      let targetDisplayId = keyToDisplayId.get(targetKey);
      if (!targetDisplayId) {
        if (unionMembers.length === 0) {
          targetDisplayId = '[∅]';
          dfaHasTrapState = true;
          keyToDisplayId.set('∅', '[∅]');
          discoveredBy.set(
            '[∅]',
            `Aparece porque desde ${curr.displayId} no hay vía válida para "${sym}" (resultado ∅).`
          );
          bfsQueue.push({ displayId: '[∅]', members: [], isDead: true });
        } else {
          targetDisplayId = `[${unionMembers.join(',')}]`;
          keyToDisplayId.set(targetKey, targetDisplayId);
          discoveredBy.set(
            targetDisplayId,
            `Nace al leer "${sym}" desde ${curr.displayId}: une en un solo súper-andén a {${unionMembers.join(',')}}.`
          );
          bfsQueue.push({ displayId: targetDisplayId, members: unionMembers, isDead: false });
        }
      }

      transitions[sym] = targetDisplayId;
      unionBreakdown[sym] = `${partStrings.join(' ∪ ')} = ${targetDisplayId}`;

      const presetDfa = isExerciseA2 ? DFA_STATIONS[curr.displayId as keyof typeof DFA_STATIONS] : undefined;
      if (presetDfa && (sym === 'a' || sym === 'b')) {
        hintBySymbol[sym] = sym === 'a' ? presetDfa.hintA : presetDfa.hintB;
      } else {
        hintBySymbol[sym] =
          targetDisplayId === '[∅]'
            ? `Ningún miembro de ${curr.displayId} tiene salida con "${sym}" → Cae al pozo [∅].`
            : `Unimos las salidas con "${sym}" de ${curr.members.join(', ')}: ${unionBreakdown[sym]}.`;
      }
    }

    const acceptingMembers = curr.members.filter(
      (m) => rowByState[m].efNew === '1' || spec.acceptStates.includes(m)
    );
    const ef: '∅' | '1' = acceptingMembers.length > 0 ? '1' : '∅';
    const presetDfa = isExerciseA2 ? DFA_STATIONS[curr.displayId as keyof typeof DFA_STATIONS] : undefined;

    dfaRows[curr.displayId] = {
      id: curr.displayId,
      members: curr.members,
      transitions,
      unionBreakdown,
      ef,
      isStart: curr.displayId === dfaStartId,
      isDeadEnd: false,
      subtitle:
        presetDfa?.subtitle ??
        (curr.displayId === dfaStartId && ef === '1'
          ? 'Inicio · Salida Válida (EF=1)'
          : curr.displayId === dfaStartId
          ? 'Inicio del recorrido'
          : ef === '1'
          ? 'Salida Válida (EF=1)'
          : 'Estación de tránsito'),
      whyExists: presetDfa?.whyExists ?? discoveredBy.get(curr.displayId) ?? '',
      hintBySymbol,
      hintEF:
        presetDfa?.hintEF ??
        (ef === '1'
          ? `Contiene a ${acceptingMembers.join(', ')} (que tiene salida válida) → EF = 1.`
          : `Ninguno de sus miembros (${curr.members.join(', ')}) alcanza la salida → EF = ∅.`),
      x: presetDfa?.x ?? 200,
      y: presetDfa?.y ?? 200,
    };
  }

  const minimizedDfa = minimizeDfa(dfaOrder, dfaRows, spec.alphabet, dfaStartId);
  const testCases = generateAutoTestCases(spec, dfaOrder, dfaRows, dfaStartId);
  const quizQuestions = generateAutoQuiz(spec, stage2Rows, dfaOrder, dfaRows, dfaStartId);
  const nfaLayout = computeNfaLayout(spec, stations);
  const dfaLayout = computeDfaLayout(spec, dfaOrder, dfaRows);

  const candidateSets = Array.from(candidateSetValues).sort((a, b) => {
    if (a === '∅') return 1;
    if (b === '∅') return -1;
    if (a.length !== b.length) return a.length - b.length;
    return a.localeCompare(b);
  });

  return {
    spec,
    stations,
    stage2Rows,
    candidateSets,
    dfaStartId,
    dfaOrder,
    dfaRows,
    dfaHasTrapState,
    startHadEpsilonExpansion: startClosure.length > 1,
    minimizedDfa,
    testCases,
    quizQuestions,
    nfaLayout,
    dfaLayout,
  };
}

// ============================================================================
// 5. TRACE RUNNERS (NFA-ε & DFA FOR ANY AUTOMATON)
// ============================================================================

export function traceNfaExecution(bundle: SolvedMethodBundle, rawInput: string): NfaTraceStep[] {
  const { spec, stations } = bundle;
  const clean = rawInput.trim();

  const initialClosure = computeEpsilonClosure([spec.startState], spec.transitions, spec.states);
  const initEdges = collectEpsilonEdgesAlong([spec.startState], initialClosure, spec.transitions);

  const steps: NfaTraceStep[] = [
    {
      stepIndex: 0,
      consumedSymbol: 'Inicio',
      activeStates: initialClosure,
      highlightedEdges: initEdges,
      narration:
        initialClosure.length > 1
          ? `Entras por ${spec.startState} (${stations[spec.startState]?.metroName}). Gracias a los pasillos gratis (ε), te clonas desde el inicio en {${initialClosure.join(', ')}}.`
          : `Entras por ${spec.startState} (${stations[spec.startState]?.metroName}). Como no salen pasillos gratis (ε), estás únicamente en ${spec.startState}.`,
    },
  ];

  let current = initialClosure;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const moved: string[] = [];
    const movedSet = new Set<string>();
    const trainEdges: string[] = [];

    for (const st of current) {
      for (const tr of spec.transitions) {
        if (tr.from === st && tr.label === ch) {
          trainEdges.push(tr.id);
          if (!movedSet.has(tr.to)) {
            movedSet.add(tr.to);
            moved.push(tr.to);
          }
        }
      }
    }

    if (moved.length === 0) {
      steps.push({
        stepIndex: i + 1,
        consumedSymbol: ch,
        activeStates: [],
        highlightedEdges: [],
        narration: `Mostraste "${ch}", pero ninguna de tus posiciones actuales (${current.join(', ') || '∅'}) tiene tren "${ch}". El pasajero desaparece (camino muerto ∅).`,
      });
      current = [];
      continue;
    }

    const afterClosure = computeEpsilonClosure(moved, spec.transitions, spec.states);
    const epsEdges = collectEpsilonEdgesAlong(moved, afterClosure, spec.transitions);

    let narration = `Pagas "${ch}" y el tren te deja en ${moved.join(', ')}. `;
    if (afterClosure.length > moved.length) {
      narration += `¡Clonación ε! Al bajar caminas gratis y estás al mismo tiempo en {${afterClosure.join(', ')}}.`;
    } else {
      narration += `Sin pasillos gratis desde ${moved.join(', ')}, quedas en {${afterClosure.join(', ')}}.`;
    }

    steps.push({
      stepIndex: i + 1,
      consumedSymbol: ch,
      activeStates: afterClosure,
      highlightedEdges: [...trainEdges, ...epsEdges],
      narration,
    });
    current = afterClosure;
  }

  return steps;
}

function collectEpsilonEdgesAlong(
  seeds: string[],
  closure: string[],
  transitions: NfaTransitionSpec[]
): string[] {
  const closureSet = new Set(closure);
  const visited = new Set(seeds);
  const queue = [...seeds];
  const edgeIds: string[] = [];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const tr of transitions) {
      if (tr.from === curr && tr.label === 'ε' && closureSet.has(tr.to)) {
        edgeIds.push(tr.id);
        if (!visited.has(tr.to)) {
          visited.add(tr.to);
          queue.push(tr.to);
        }
      }
    }
  }
  return edgeIds;
}

export function stepNfaStates(
  bundle: SolvedMethodBundle,
  currentStates: string[],
  symbol: string
): string[] {
  const moved: string[] = [];
  const seen = new Set<string>();
  for (const st of currentStates) {
    for (const tr of bundle.spec.transitions) {
      if (tr.from === st && tr.label === symbol && !seen.has(tr.to)) {
        seen.add(tr.to);
        moved.push(tr.to);
      }
    }
  }
  if (moved.length === 0) return [];
  return computeEpsilonClosure(moved, bundle.spec.transitions, bundle.spec.states);
}

export function traceDfaExecution(bundle: SolvedMethodBundle, rawInput: string): DfaTraceStep[] {
  const clean = rawInput.trim();
  const { spec, dfaStartId, dfaRows, dfaLayout } = bundle;

  const steps: DfaTraceStep[] = [
    {
      step: 0,
      symbol: 'Inicio',
      state: dfaStartId,
      edgeId: null,
      narration: `El tren arranca en ${dfaStartId} (Inicio). ${dfaRows[dfaStartId].ef === '1' ? 'Ya es salida válida (EF = 1).' : 'Esperando el primer boleto.'}`,
    },
  ];

  let current = dfaStartId;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (!spec.alphabet.includes(ch)) {
      steps.push({
        step: i + 1,
        symbol: ch,
        state: 'INVALID_CHAR',
        edgeId: null,
        narration: `El símbolo "${ch}" no pertenece al alfabeto Σ = {${spec.alphabet.join(', ')}}. El torniquete rechaza el viaje de inmediato.`,
      });
      break;
    }

    const row = dfaRows[current];
    const next = row.transitions[ch];
    const matchingEdge = dfaLayout.edges.find(
      (e) => e.from === current && e.to === next && e.symbols.includes(ch)
    );
    const nextRow = dfaRows[next];

    let narration = `Mostraste "${ch}" en ${current} → el tren avanza a ${next}. `;
    if (nextRow.isDeadEnd) {
      narration +=
        current === '[∅]'
          ? 'Sigues atrapado en la Vía Muerta [∅] sin salida.'
          : 'Boleto prohibido en esta estación: te desvía a la Vía Muerta [∅] sin retorno.';
    } else if (nextRow.ef === '1') {
      narration +=
        next === current
          ? 'Te mantienes en bucle dentro de una salida válida (EF = 1).'
          : 'Llegaste a una salida válida (EF = 1). ¡Si terminas aquí, la cadena se acepta!';
    } else {
      narration += 'Sigues en camino válido pero aún no es salida (EF = ∅).';
    }

    steps.push({
      step: i + 1,
      symbol: ch,
      state: next,
      edgeId: matchingEdge?.id ?? null,
      narration,
    });
    current = next;
  }

  return steps;
}

// ============================================================================
// 6. MARKDOWN STUDY SHEET GENERATOR (FOR LOCAL EXPORT & GOOGLE DRIVE)
// ============================================================================

export function generateStudyGuideMarkdown(bundle: SolvedMethodBundle): string {
  const { spec, stage2Rows, dfaOrder, dfaRows, minimizedDfa, testCases } = bundle;
  const alpha = spec.alphabet;

  const lines: string[] = [];
  lines.push(`# Guía Completa Método AFN-ε → AFD: ${spec.title}`);
  if (spec.regex) lines.push(`- **Expresión Regular:** \`${spec.regex}\``);
  lines.push(`- **Alfabeto:** \`Σ = {${alpha.join(', ')}}\``);
  lines.push(`- **Estado Inicial AFN-ε:** \`${spec.startState}\``);
  lines.push(`- **Estados Finales Originales:** \`{${spec.acceptStates.join(', ')}}\``);
  lines.push('');

  lines.push('## Paso 1 · Transiciones del AFN-ε (Lámina 1)');
  lines.push('| Origen | Símbolo | Destino | Tipo | Explicación |');
  lines.push('| --- | :---: | --- | --- | --- |');
  for (const tr of spec.transitions) {
    lines.push(
      `| ${tr.from} | \`${tr.label}\` | ${tr.to} | ${tr.kind === 'walk' ? 'Pasillo gratis (ε)' : 'Tren pagado'} | ${tr.explanation} |`
    );
  }
  lines.push('');

  lines.push('## Paso 2 · Tabla de 3 Pasos `ε-C → δ(x, σ) → ε-C` y Tabla AFN (Lámina 2)');
  const headerCols = ['Estado', '1. ε-C'];
  for (const sym of alpha) {
    headerCols.push(`2. δ(x, ${sym})`, `3. ε-C → AFN(${sym})`);
  }
  headerCols.push('EF orig.', 'EF nuevo');
  lines.push(`| ${headerCols.join(' | ')} |`);
  lines.push(`| ${headerCols.map(() => '---').join(' | ')} |`);
  for (const row of stage2Rows) {
    const cols = [row.state, row.epsilonC];
    for (const sym of alpha) {
      cols.push(row.bySymbol[sym].delta, row.bySymbol[sym].closure);
    }
    cols.push(row.efOriginal, row.efNew);
    lines.push(`| ${cols.join(' | ')} |`);
  }
  lines.push('');

  lines.push('## Paso 3 · Construcción de Subconjuntos (AFN → AFD en orden BFS, Lámina 3)');
  const dfaCols = ['Súper-Estado', ...alpha.map((s) => `Con \`${s}\``), 'EF', 'Unión / Explicación'];
  lines.push(`| ${dfaCols.join(' | ')} |`);
  lines.push(`| ${dfaCols.map(() => '---').join(' | ')} |`);
  for (const id of dfaOrder) {
    const r = dfaRows[id];
    const breakdown = alpha.map((s) => `${s}: ${r.unionBreakdown[s]}`).join(' ; ');
    lines.push(
      `| \`${id}\`${r.isStart ? ' (Inicio)' : ''} | ${alpha.map((s) => `\`${r.transitions[s]}\``).join(' | ')} | ${r.ef} | ${breakdown} |`
    );
  }
  lines.push('');

  lines.push('## Paso 4 · Validación de Cadenas y Minimización (Lámina 4)');
  lines.push('| Cadena | Resultado | Razón |');
  lines.push('| --- | :---: | --- |');
  for (const tc of testCases) {
    lines.push(`| \`${tc.text || 'ε'}\` | ${tc.expectedValid ? '✅ Aceptada' : '❌ Rechazada'} | ${tc.reason} |`);
  }
  lines.push('');
  lines.push(`### Bonus: AFD Minimizado (${minimizedDfa.states.length} estados)`);
  lines.push(minimizedDfa.summary);
  lines.push('');
  for (const ms of minimizedDfa.states) {
    lines.push(
      `- **${ms.id}**${ms.isStart ? ' [Inicio]' : ''}${ms.ef === '1' ? ' [EF=1]' : ''}: ${alpha.map((s) => `${s} → ${ms.transitions[s]}`).join(', ')}`
    );
  }

  return lines.join('\n');
}

// ============================================================================
// 7. PRESET EXERCISE BANK
// ============================================================================

export const PRESET_EXERCISES: NfaSpec[] = [
  buildNfaFromRegex('(ab)a*', {
    id: 'a2-ab-astar',
    title: 'Ejercicio A2 · (ab)a* (Base de Clase)',
    difficulty: 'Base de Clase',
    description:
      'El ejercicio exacto de las 4 láminas: entradas repetidas con pasillos ε en C y E, tabla de 3 pasos y Vía Muerta [∅].',
  }),
  buildNfaFromRegex('(a|b)*abb', {
    id: 'c1-ends-abb',
    title: 'Clásico de Compiladores · (a|b)*abb',
    difficulty: 'Examen',
    description:
      'Acepta cualquier palabra sobre {a, b} que termine exactamente en "abb". Ideal para practicar unión + Kleene + subconjuntos.',
  }),
  buildNfaFromRegex('a(ba)*', {
    id: 'c2-aba-star',
    title: 'Alternancia · a(ba)*',
    difficulty: 'Intermedio',
    description:
      'Empieza obligatorio con "a" y permite repetir el bloque "ba" cero o más veces.',
  }),
  buildNfaFromRegex('(a|b)+', {
    id: 'c3-plus-union',
    title: 'Cerradura Positiva · (a|b)+',
    difficulty: 'Básico',
    description:
      'Compara la diferencia entre * y +: requiere mínimo 1 símbolo (a o b), rechazando la cadena vacía ε.',
  }),
  buildNfaFromRegex('a*b*', {
    id: 'c4-astar-bstar',
    title: 'Inicio Clonado · a*b*',
    difficulty: 'Intermedio',
    description:
      'Cero o más "a"s seguidas de cero o más "b"s. ¡Observa cómo el inicio tiene múltiples puentes ε y arranca ya clonado!',
  }),
  buildNfaFromRegex('(ab|ba)*', {
    id: 'c5-pairs-star',
    title: 'Doble Rama en Bucle · (ab|ba)*',
    difficulty: 'Examen',
    description:
      'Cualquier secuencia formada por bloques "ab" o "ba" (incluyendo ε). Excelente reto para la tabla de 3 pasos.',
  }),
  buildNfaFromRegex('0(0|1)*1', {
    id: 'c6-binary',
    title: 'Alfabeto Binario · 0(0|1)*1',
    difficulty: 'Intermedio',
    description:
      'Demuestra que el método funciona con cualquier alfabeto Σ = {0, 1}: cadenas binarias que inician con 0 y terminan en 1.',
  }),
];

export const DEFAULT_EXERCISE_BUNDLE: SolvedMethodBundle = solveAutomatonMethod(PRESET_EXERCISES[0]);
export { DFA_ORDER, getStationVisualSpec };
