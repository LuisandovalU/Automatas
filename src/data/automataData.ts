export type SymbolInput = 'a' | 'b';

export type NfaState = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type DfaStateId = '[A]' | '[B]' | '[∅]' | '[C,D,F]' | '[E,D,F]';

export interface StationMeta {
  id: NfaState;
  metroName: string;
  role: string;
  description: string;
  isStart?: boolean;
  isOriginalAccept?: boolean;
  isNewAccept: boolean;
  epsilonClosure: NfaState[];
  closureReason: string;
  x: number;
  y: number;
}

export const NFA_STATIONS: Record<NfaState, StationMeta> = {
  A: {
    id: 'A',
    metroName: 'Pantitlán',
    role: 'Estación Inicial',
    description: 'Punto de partida. Todo pasajero entra por aquí antes de mostrar su primer boleto.',
    isStart: true,
    isOriginalAccept: false,
    isNewAccept: false,
    epsilonClosure: ['A'],
    closureReason: 'De A no sale ningún pasillo peatonal gratis (ε). Si no muestras boleto, te quedas en A.',
    x: 100,
    y: 180,
  },
  B: {
    id: 'B',
    metroName: 'Pino Suárez',
    role: 'Andén Intermedio',
    description: 'Llegaste después de pagar tu primer boleto "a". Ahora el torniquete espera una "b".',
    isOriginalAccept: false,
    isNewAccept: false,
    epsilonClosure: ['B'],
    closureReason: 'De B tampoco salen pasillos gratis (ε). Tu alcance sin boleto es solo B.',
    x: 245,
    y: 180,
  },
  C: {
    id: 'C',
    metroName: 'Tacubaya',
    role: 'Gran Transbordo',
    description: '¡Ya cumpliste "ab"! Aquí nacen dos pasillos gratuitos: uno hacia el bucle D y otro directo a la Salida F.',
    isOriginalAccept: false,
    isNewAccept: true,
    epsilonClosure: ['C', 'D', 'F'],
    closureReason: 'Desde C puedes quedarte en C, caminar gratis por el pasillo ε hacia D, o caminar gratis directo a la salida F.',
    x: 390,
    y: 180,
  },
  D: {
    id: 'D',
    metroName: 'Chabacano',
    role: 'Entrada del Bucle a*',
    description: 'Andén para repetir boletos "a" adicionales. Solo te permite abordar el tren "a" hacia E.',
    isOriginalAccept: false,
    isNewAccept: false,
    epsilonClosure: ['D'],
    closureReason: 'Desde D no hay pasillos gratis (ε) hacia adelante ni hacia atrás; necesitas mostrar un boleto "a" para moverte.',
    x: 535,
    y: 180,
  },
  E: {
    id: 'E',
    metroName: 'Hidalgo',
    role: 'Retorno o Salida',
    description: 'Llegaste tras leer una "a" extra. Desde aquí caminas gratis de vuelta a D (para otra "a") o a la Salida F.',
    isOriginalAccept: false,
    isNewAccept: true,
    epsilonClosure: ['E', 'D', 'F'],
    closureReason: 'Desde E puedes quedarte en E, regresar gratis por el pasillo superior hacia D, o salir gratis hacia F.',
    x: 680,
    y: 180,
  },
  F: {
    id: 'F',
    metroName: 'Zócalo · Salida',
    role: 'Torniquete de Salida',
    description: 'Meta final del viaje. Si alcanzas esta estación al terminar tus boletos, tu viaje es válido.',
    isOriginalAccept: true,
    isNewAccept: true,
    epsilonClosure: ['F'],
    closureReason: 'Ya estás en la meta F y de aquí no salen más pasillos.',
    x: 825,
    y: 180,
  },
};

export interface NfaTransition {
  id: string;
  from: NfaState;
  to: NfaState;
  label: 'a' | 'b' | 'ε';
  kind: 'train' | 'walk';
  explanation: string;
}

export const NFA_TRANSITIONS: NfaTransition[] = [
  {
    id: 'A-a-B',
    from: 'A',
    to: 'B',
    label: 'a',
    kind: 'train',
    explanation: 'Tren "a": avanza de Pantitlán (A) a Pino Suárez (B).',
  },
  {
    id: 'B-b-C',
    from: 'B',
    to: 'C',
    label: 'b',
    kind: 'train',
    explanation: 'Tren "b": avanza de Pino Suárez (B) al transbordo Tacubaya (C).',
  },
  {
    id: 'C-e-D',
    from: 'C',
    to: 'D',
    label: 'ε',
    kind: 'walk',
    explanation: 'Pasillo gratis (ε): caminas de C a D por si quieres tomar más trenes "a".',
  },
  {
    id: 'C-e-F',
    from: 'C',
    to: 'F',
    label: 'ε',
    kind: 'walk',
    explanation: 'Pasillo directo gratis (ε): si ya no tienes más boletos, saltas directo a la salida F.',
  },
  {
    id: 'D-a-E',
    from: 'D',
    to: 'E',
    label: 'a',
    kind: 'train',
    explanation: 'Tren "a" del bucle: avanza de Chabacano (D) a Hidalgo (E).',
  },
  {
    id: 'E-e-D',
    from: 'E',
    to: 'D',
    label: 'ε',
    kind: 'walk',
    explanation: 'Pasillo de retorno gratis (ε): regresas de E a D para poder tomar otro tren "a".',
  },
  {
    id: 'E-e-F',
    from: 'E',
    to: 'F',
    label: 'ε',
    kind: 'walk',
    explanation: 'Pasillo de salida gratis (ε): terminas el bucle saliendo de E hacia la meta F.',
  },
];

export interface Image2Row {
  state: NfaState;
  epsilonC: string;
  deltaA: string;
  epsilonCA: string;
  deltaB: string;
  epsilonCB: string;
  afnA: string;
  afnB: string;
  efOriginal: '∅' | '1';
  efNew: '∅' | '1';
  whyA: string;
  whyB: string;
  whyEF: string;
}

export const IMAGE2_TABLE: Image2Row[] = [
  {
    state: 'A',
    epsilonC: 'A',
    deltaA: 'B',
    epsilonCA: 'B',
    deltaB: '∅',
    epsilonCB: '∅',
    afnA: 'B',
    afnB: '∅',
    efOriginal: '∅',
    efNew: '∅',
    whyA: 'En A solo alcanzas a A (sin pasillos). Con tren "a" llegas a B, y B no tiene pasillos gratis: quedas en B.',
    whyB: 'En A no existe tren "b". Resultado vacío (∅).',
    whyEF: 'Desde A no puedes llegar caminando gratis hasta F, así que sigue sin ser salida (∅).',
  },
  {
    state: 'B',
    epsilonC: 'B',
    deltaA: '∅',
    epsilonCA: '∅',
    deltaB: 'C',
    epsilonCB: 'C,D,F',
    afnA: '∅',
    afnB: 'C,D,F',
    efOriginal: '∅',
    efNew: '∅',
    whyA: 'En B solo esperas "b". No hay vía para "a" (∅).',
    whyB: 'Con "b" llegas a C. Y apenas pisas C, los pasillos gratis te permiten estar en C, D o F al mismo tiempo.',
    whyEF: 'Desde B no puedes caminar gratis a F; necesitas pagar antes un boleto "b".',
  },
  {
    state: 'C',
    epsilonC: 'C,D,F',
    deltaA: 'E',
    epsilonCA: 'E,D,F',
    deltaB: '∅',
    epsilonCB: '∅',
    afnA: 'E,D,F',
    afnB: '∅',
    efOriginal: '∅',
    efNew: '1',
    whyA: 'Si estás en C, caminas gratis a {C,D,F}. De esos tres, solo D tiene tren "a" (lleva a E). Al pisar E, caminas gratis a {E,D,F}.',
    whyB: 'Ni C, ni D, ni F tienen tren "b".',
    whyEF: '¡Cambia a 1! Aunque C no era meta original, su pasillo ε te deja caminar gratis hasta F.',
  },
  {
    state: 'D',
    epsilonC: 'D',
    deltaA: 'E',
    epsilonCA: 'E,D,F',
    deltaB: '∅',
    epsilonCB: '∅',
    afnA: 'E,D,F',
    afnB: '∅',
    efOriginal: '∅',
    efNew: '∅',
    whyA: 'De D tomas el tren "a" a E, y en E los pasillos gratis te expanden a {E,D,F}.',
    whyB: 'D solo tiene tren "a", nunca "b".',
    whyEF: 'D no tiene pasillo gratis directo hacia F (primero debes pagar "a" hacia E).',
  },
  {
    state: 'E',
    epsilonC: 'E,D,F',
    deltaA: 'E',
    epsilonCA: 'E,D,F',
    deltaB: '∅',
    epsilonCB: '∅',
    afnA: 'E,D,F',
    afnB: '∅',
    efOriginal: '∅',
    efNew: '1',
    whyA: 'Desde E caminas gratis a {E,D,F}. De ahí, D toma tren "a" hacia E, y vuelves a expandirte a {E,D,F}.',
    whyB: 'Ninguno de {E,D,F} tiene tren "b".',
    whyEF: '¡Cambia a 1! Desde E tienes un pasillo gratis directo a la salida F.',
  },
  {
    state: 'F',
    epsilonC: 'F',
    deltaA: '∅',
    epsilonCA: '∅',
    deltaB: '∅',
    epsilonCB: '∅',
    afnA: '∅',
    afnB: '∅',
    efOriginal: '1',
    efNew: '1',
    whyA: 'F es únicamente salida; no salen trenes de aquí.',
    whyB: 'F no tiene salidas de tren "b".',
    whyEF: 'F ya era la estación de salida original (1).',
  },
];

export interface DfaStationMeta {
  id: DfaStateId;
  metroName: string;
  subtitle: string;
  onA: DfaStateId;
  onB: DfaStateId;
  ef: '∅' | '1';
  isStart?: boolean;
  isDeadEnd?: boolean;
  x: number;
  y: number;
  whyExists: string;
  hintA: string;
  hintB: string;
  hintEF: string;
}

export const DFA_STATIONS: Record<DfaStateId, DfaStationMeta> = {
  '[A]': {
    id: '[A]',
    metroName: 'Súper-Estación [A]',
    subtitle: 'Inicio · Esperando "a"',
    onA: '[B]',
    onB: '[∅]',
    ef: '∅',
    isStart: true,
    x: 420,
    y: 110,
    whyExists: 'Todo viaje empieza únicamente en A.',
    hintA: 'En la tabla AFN, A con "a" va a B → Súper-estación [B].',
    hintB: 'En la tabla AFN, A con "b" va a ∅ → Cae al pozo [∅].',
    hintEF: 'A no contiene a F ni tiene EF=1 → ∅.',
  },
  '[B]': {
    id: '[B]',
    metroName: 'Súper-Estación [B]',
    subtitle: 'Ya leíste "a" · Esperando "b"',
    onA: '[∅]',
    onB: '[C,D,F]',
    ef: '∅',
    x: 700,
    y: 110,
    whyExists: 'Se descubre cuando [A] lee una "a".',
    hintA: 'En B no hay tren "a" (AFN da ∅) → Cae a [∅].',
    hintB: 'En B con "b" llegas a C y caminas gratis a D y F → [C,D,F].',
    hintEF: 'B no contiene a F (EF=∅) → ∅.',
  },
  '[∅]': {
    id: '[∅]',
    metroName: 'Vía Muerta [∅]',
    subtitle: 'Boleto inválido · Sin retorno',
    onA: '[∅]',
    onB: '[∅]',
    ef: '∅',
    isDeadEnd: true,
    x: 560,
    y: 255,
    whyExists: 'Un AFD no puede desaparecer; si das un boleto inválido, te manda a este taller sin salida.',
    hintA: 'Si ya te desviaste a la vía muerta, cualquier "a" te deja atrapado en [∅].',
    hintB: 'Cualquier "b" también te mantiene en [∅].',
    hintEF: 'El conjunto vacío jamás contiene la salida F → ∅.',
  },
  '[C,D,F]': {
    id: '[C,D,F]',
    metroName: 'Súper-Estación [C,D,F]',
    subtitle: 'Completaste "ab" · Salida Válida',
    onA: '[E,D,F]',
    onB: '[∅]',
    ef: '1',
    x: 740,
    y: 380,
    whyExists: 'Nace al leer "b" desde [B]: fusiona Tacubaya (C), Chabacano (D) y Zócalo (F) en un solo lugar.',
    hintA: 'Unimos salidas con "a" de C, D y F: C→E,D,F; D→E,D,F; F→∅. La unión es [E,D,F].',
    hintB: 'Ni C, ni D, ni F aceptan otra "b" → Cae al pozo [∅].',
    hintEF: 'Contiene a C y a F (que tienen EF=1) → ¡Es salida válida (1)!',
  },
  '[E,D,F]': {
    id: '[E,D,F]',
    metroName: 'Súper-Estación [E,D,F]',
    subtitle: 'Bucle a* activo · Salida Válida',
    onA: '[E,D,F]',
    onB: '[∅]',
    ef: '1',
    x: 340,
    y: 380,
    whyExists: 'Nace al leer una o más "a" extras después de "ab". Fusiona Hidalgo (E), Chabacano (D) y Zócalo (F).',
    hintA: 'Unimos salidas con "a" de E, D y F: E→E,D,F; D→E,D,F; F→∅. ¡Vuelve a [E,D,F]!',
    hintB: 'Ninguno acepta "b" después de empezar las "a"s → Cae al pozo [∅].',
    hintEF: 'Contiene a E y a F (ambos con salida válida) → EF = 1.',
  },
};

export const DFA_ORDER: DfaStateId[] = ['[A]', '[B]', '[∅]', '[C,D,F]', '[E,D,F]'];

export interface TestStringCase {
  text: string;
  expectedValid: boolean;
  label: string;
  reason: string;
}

export const SLIDE_TEST_STRINGS: TestStringCase[] = [
  {
    text: 'ab',
    expectedValid: true,
    label: 'A,b (ab)',
    reason: 'Cumple lo mínimo de (ab)a*: toma "a" a [B] y "b" a [C,D,F], con cero "a"s extra. Termina en salida válida.',
  },
  {
    text: 'aba',
    expectedValid: true,
    label: 'Aba',
    reason: 'Llega a [C,D,F] con "ab" y luego una "a" te pasa al bucle [E,D,F], que también es salida válida.',
  },
  {
    text: 'abaa',
    expectedValid: true,
    label: 'Abaa',
    reason: 'Entra al bucle [E,D,F] y da una vuelta sobre sí mismo con la segunda "a".',
  },
  {
    text: 'abaaa',
    expectedValid: true,
    label: 'Abaaa',
    reason: 'Da múltiples vueltas en [E,D,F]. Mientras solo muestres "a", sigues en salida válida.',
  },
  {
    text: 'abaaaaa',
    expectedValid: true,
    label: 'abaaaaa',
    reason: 'Demuestra que a* permite cualquier cantidad de "a"s después de "ab".',
  },
  {
    text: 'a',
    expectedValid: false,
    label: 'a',
    reason: 'Te deja detenido en [B] esperando la "b". Como [B] no es salida (EF = ∅), el viaje se rechaza.',
  },
  {
    text: 'b',
    expectedValid: false,
    label: 'b',
    reason: 'En [A] no puedes iniciar con "b". Te desvía de inmediato a la vía muerta [∅].',
  },
  {
    text: 'abb',
    expectedValid: false,
    label: 'Abb',
    reason: 'Con "ab" llegaste a [C,D,F], pero la segunda "b" está prohibida por (ab)a* y te manda al pozo [∅].',
  },
  {
    text: 'abas',
    expectedValid: false,
    label: 'abas',
    reason: 'Contiene el símbolo "s", que ni siquiera existe en las vías del Metro (alfabeto {a, b}).',
  },
];

export interface RootWhyQuestion {
  id: string;
  question: string;
  shortAnswer: string;
  deepExplanation: string;
}

export const ROOT_WHY_QUESTIONS: RootWhyQuestion[] = [
  {
    id: 'why-epsilon',
    question: '¿Por qué existen las transiciones ε (pasillos gratis) en el AFN-ε si al final las vamos a eliminar?',
    shortAnswer: 'Porque construir un mapa por bloques pequeños es mucho más fácil que diseñarlo todo junto.',
    deepExplanation:
      'Cuando conviertes una expresión regular como (ab)a* a un autómata, primero dibujas la pieza "ab" (A→B→C) y aparte la pieza "a*" (D→E). Para unir ambas piezas sin romper nada, pones puentes gratis ε. El precio de esa comodidad es que el mapa queda ambiguo, y por eso luego lo limpiamos.',
  },
  {
    id: 'why-cloning',
    question: '¿Por qué un torniquete real (AFD) no soporta pasillos ε?',
    shortAnswer: 'Porque un programa o máquina física no puede adivinar el futuro ni estar en dos lugares sin gastar datos.',
    deepExplanation:
      'En el AFN-ε, al llegar a C debes elegir si ir a D (si vienen más "a"s) o ir a F (si la palabra ya terminó). Un humano puede mirar toda la palabra de golpe, pero una computadora lee letra por letra sin ver qué viene después. En un AFD, cada letra debe llevarte a UN solo destino exacto.',
  },
  {
    id: 'why-ef-changes',
    question: '¿Por qué C y E no tenían doble círculo al inicio, pero en la tabla AFN su EF cambia de ∅ a 1?',
    shortAnswer: 'Porque si estás en C o en E, puedes caminar gratis hasta F sin pagar ningún boleto más.',
    deepExplanation:
      'La pregunta real de "Estado Final (EF)" es: ¿si los boletos se acaban justo aquí, puedo salir del Metro? En C y E la respuesta es SÍ, porque tienen un pasillo peatonal ε directo hacia F. Por eso al borrar los pasillos ε, C y E heredan el permiso de salida.',
  },
  {
    id: 'why-brackets',
    question: '¿Por qué en el AFD los estados llevan corchetes como [C,D,F] y desaparecieron [D] y [F] solos?',
    shortAnswer: 'Los corchetes representan "súper-estaciones" que agrupan todos los lugares donde podrías estar a la vez, y solo listamos las alcanzables desde [A].',
    deepExplanation:
      'Desde el inicio [A], jamás existe una combinación de boletos que te deje únicamente en D ni únicamente en F. Siempre llegas en paquete junto con C o con E. Por eso en la Imagen 3 la tabla pasa de 6 filas (A..F) a solo 5 súper-estaciones reales: [A], [B], [∅], [C,D,F] y [E,D,F].',
  },
  {
    id: 'why-sink',
    question: '¿Por qué aparece la estación [∅] (el pozo) si ni siquiera estaba en el dibujo original?',
    shortAnswer: 'Porque un AFD está obligado a responder qué pasa ante CUALQUIER boleto, incluso los incorrectos.',
    deepExplanation:
      'En el AFN-ε original, si estabas en A y alguien metía una "b", simplemente no había flecha y el camino moría. Pero en un sistema determinista (AFD), todas las estaciones deben tener flecha para "a" y flecha para "b". La estación [∅] atrapa todos los errores y los retiene para siempre.',
  },
  {
    id: 'why-two-accepts',
    question: '¿Por qué hay dos súper-estaciones finales ([C,D,F] y [E,D,F]) si ambas hacen casi lo mismo?',
    shortAnswer: 'Porque la construcción de subconjuntos distingue si llegaste por primera vez con "b" o si ya diste al menos una vuelta en "a*".',
    deepExplanation:
      'Observa la tabla de la Imagen 4: [C,D,F] y [E,D,F] tienen exactamente las mismas salidas (a → [E,D,F], b → [∅], EF = 1). La diferencia es histórica: [C,D,F] recuerda que acabas de terminar "ab" (0 "a"s extra), mientras [E,D,F] recuerda que ya leíste al menos una "a" extra. (Nota avanzada: en minimización de AFD incluso podrían fusionarse, pero el algoritmo estándar las deja separadas así).',
  },
];

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    prompt: 'Si estás en Tacubaya (C) y no muestras ningún boleto nuevo, ¿a qué andenes puedes llegar gratis?',
    options: ['Solo a C', 'A C y D únicamente', 'A C, D y F al mismo tiempo', 'A D, E y F'],
    correctIndex: 2,
    explanation: 'Desde C salen dos pasillos ε: uno hacia D y otro directo hacia F. Contando donde ya estás (C), tu ε-cerradura es {C, D, F}.',
  },
  {
    id: 'q2',
    prompt: '¿Por qué la tabla de la Imagen 2 calcula primero ε-C, luego δ(x, a) y otra vez ε-C?',
    options: [
      'Para ver dónde estabas antes del tren, qué estación toca el tren, y hasta dónde caminas gratis al bajar.',
      'Para multiplicar por dos la cantidad de boletos necesarios.',
      'Porque el Metro CDMX cobra doble transbordo en horas pico.',
      'Para eliminar la letra "a" de la expresión regular.',
    ],
    correctIndex: 0,
    explanation: 'Caminas gratis antes de subir (ε-C), viajas un tramo pagado (δ), y caminas gratis al bajar (ε-C). Eso resume todo movimiento invisible en un solo salto.',
  },
  {
    id: 'q3',
    prompt: '¿Por qué [C,D,F] tiene EF = 1 en el AFD final?',
    options: [
      'Porque D es una estación inicial.',
      'Porque contiene a F (la salida original) y además C puede caminar gratis hasta F.',
      'Porque tiene 3 letras dentro de los corchetes.',
      'Porque desde ahí puedes leer otra "b".',
    ],
    correctIndex: 1,
    explanation: 'Basta con que un súper-estado contenga al menos una estación de aceptación (F, o en la tabla AFN también C y E) para que puedas salir válido.',
  },
  {
    id: 'q4',
    prompt: 'Metes el boleto "abb" en el torniquete del AFD. ¿En qué estación quedas atrapado y por qué?',
    options: [
      'En [E,D,F], porque la última b reinicia el bucle.',
      'En [C,D,F], porque ya habías cumplido "ab".',
      'En [∅] (Vía Muerta), porque desde [C,D,F] un boleto "b" es inválido.',
      'En [A], porque te devuelve al inicio.',
    ],
    correctIndex: 2,
    explanation: 'Con "a" vas a [B], con "b" vas a [C,D,F], pero al llegar la segunda "b", la vía te desvía a [∅] y de ahí ya no hay salida.',
  },
  {
    id: 'q5',
    prompt: '¿Por qué en el AFD final desaparecieron [D] y [F] como estaciones independientes?',
    options: [
      'Porque se cerraron por mantenimiento.',
      'Porque empezando en [A], ningún boleto te deja aislado solo en D o solo en F.',
      'Porque D y F son equivalentes a [A].',
      'Por error tipográfico de la tabla.',
    ],
    correctIndex: 1,
    explanation: 'Al hacer la conversión AFN → AFD solo construimos los conjuntos alcanzables desde [A]. Nunca llegas a D sin pasar por C o E, ni a F sin venir en paquete.',
  },
  {
    id: 'q6',
    prompt: 'En el AFD final, si estás en [E,D,F] y llegan 50 boletos "a" seguidos, ¿qué ocurre?',
    options: [
      'Te regresas a [A] en cada boleto.',
      'Te quedas dando vueltas en el auto-bucle [E,D,F] → [E,D,F] y sigues en salida válida.',
      'Caes a [∅] después de la tercera "a".',
      'Se alterna entre [B] y [C,D,F].',
    ],
    correctIndex: 1,
    explanation: 'Esa es la magia de a* en (ab)a*: la flecha de "a" en [E,D,F] apunta a sí misma, aceptando cualquier cantidad de "a"s repetidas.',
  },
];
