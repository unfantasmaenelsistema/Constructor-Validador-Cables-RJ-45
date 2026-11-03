export type WireId = 'WG' | 'G' | 'WO' | 'B' | 'WB' | 'O' | 'WBr' | 'Br';

export type WireFault = 'ok' | 'cut' | 'short';

export interface WireDefinition {
  id: WireId;
  name: string;
  shortName: string;
  pairNumber: 1 | 2 | 3 | 4;
  pairName: string;
  isStriped: boolean;
  baseColor: string;
  stripeColor?: string;
  borderColor: string;
  textColor: string;
  /** Characteristic loop resistance factor (slightly varied per pair twist pitch) */
  twistPitchFactor: number;
}

export const WIRES: Record<WireId, WireDefinition> = {
  WG: {
    id: 'WG',
    name: 'Blanco-Verde',
    shortName: 'B-Verde',
    pairNumber: 3,
    pairName: 'Par 3 (Verde)',
    isStriped: true,
    baseColor: '#16A34A',
    stripeColor: '#FFFFFF',
    borderColor: '#15803D',
    textColor: '#064E3B',
    twistPitchFactor: 1.02,
  },
  G: {
    id: 'G',
    name: 'Verde',
    shortName: 'Verde',
    pairNumber: 3,
    pairName: 'Par 3 (Verde)',
    isStriped: false,
    baseColor: '#16A34A',
    borderColor: '#14532D',
    textColor: '#FFFFFF',
    twistPitchFactor: 1.02,
  },
  WO: {
    id: 'WO',
    name: 'Blanco-Naranja',
    shortName: 'B-Naranja',
    pairNumber: 2,
    pairName: 'Par 2 (Naranja)',
    isStriped: true,
    baseColor: '#EA580C',
    stripeColor: '#FFFFFF',
    borderColor: '#C2410C',
    textColor: '#7C2D12',
    twistPitchFactor: 1.04,
  },
  O: {
    id: 'O',
    name: 'Naranja',
    shortName: 'Naranja',
    pairNumber: 2,
    pairName: 'Par 2 (Naranja)',
    isStriped: false,
    baseColor: '#EA580C',
    borderColor: '#9A3412',
    textColor: '#FFFFFF',
    twistPitchFactor: 1.04,
  },
  WB: {
    id: 'WB',
    name: 'Blanco-Azul',
    shortName: 'B-Azul',
    pairNumber: 1,
    pairName: 'Par 1 (Azul)',
    isStriped: true,
    baseColor: '#2563EB',
    stripeColor: '#FFFFFF',
    borderColor: '#1D4ED8',
    textColor: '#1E3A8A',
    twistPitchFactor: 1.0,
  },
  B: {
    id: 'B',
    name: 'Azul',
    shortName: 'Azul',
    pairNumber: 1,
    pairName: 'Par 1 (Azul)',
    isStriped: false,
    baseColor: '#2563EB',
    borderColor: '#1E40AF',
    textColor: '#FFFFFF',
    twistPitchFactor: 1.0,
  },
  WBr: {
    id: 'WBr',
    name: 'Blanco-Marrón',
    shortName: 'B-Marrón',
    pairNumber: 4,
    pairName: 'Par 4 (Marrón)',
    isStriped: true,
    baseColor: '#78350F',
    stripeColor: '#FFFFFF',
    borderColor: '#451A03',
    textColor: '#451A03',
    twistPitchFactor: 0.98,
  },
  Br: {
    id: 'Br',
    name: 'Marrón',
    shortName: 'Marrón',
    pairNumber: 4,
    pairName: 'Par 4 (Marrón)',
    isStriped: false,
    baseColor: '#78350F',
    borderColor: '#451A03',
    textColor: '#FFFFFF',
    twistPitchFactor: 0.98,
  },
};

export interface TwistedPairSpec {
  pairNumber: 1 | 2 | 3 | 4;
  name: string;
  positiveWire: WireId;
  negativeWire: WireId;
  colorHex: string;
}

export const TWISTED_PAIRS_SPEC: TwistedPairSpec[] = [
  {
    pairNumber: 1,
    name: 'Par 1 (Azul)',
    positiveWire: 'WB',
    negativeWire: 'B',
    colorHex: '#2563EB',
  },
  {
    pairNumber: 2,
    name: 'Par 2 (Naranja)',
    positiveWire: 'WO',
    negativeWire: 'O',
    colorHex: '#EA580C',
  },
  {
    pairNumber: 3,
    name: 'Par 3 (Verde)',
    positiveWire: 'WG',
    negativeWire: 'G',
    colorHex: '#16A34A',
  },
  {
    pairNumber: 4,
    name: 'Par 4 (Marrón)',
    positiveWire: 'WBr',
    negativeWire: 'Br',
    colorHex: '#78350F',
  },
];

export const ALL_WIRE_IDS: WireId[] = ['WO', 'O', 'WG', 'B', 'WB', 'G', 'WBr', 'Br'];

export const STANDARD_T568A: WireId[] = ['WG', 'G', 'WO', 'B', 'WB', 'O', 'WBr', 'Br'];
export const STANDARD_T568B: WireId[] = ['WO', 'O', 'WG', 'B', 'WB', 'G', 'WBr', 'Br'];
export const STANDARD_GIGABIT_CROSS_B: WireId[] = ['WG', 'G', 'WO', 'WBr', 'Br', 'O', 'B', 'WB'];
export const STANDARD_ROLLOVER_B: WireId[] = ['Br', 'WBr', 'G', 'WB', 'B', 'WG', 'O', 'WO'];

export interface PinSpec {
  pin: number;
  fastEthernetSignal: string;
  fastEthernetRole: string;
  gigabitSignal: string;
  poeModeA: string;
  poeModeB: string;
  wire568A: WireId;
  wire568B: WireId;
}

export const PIN_SPECS: PinSpec[] = [
  {
    pin: 1,
    fastEthernetSignal: 'TX+',
    fastEthernetRole: 'Transmisión de datos (+)',
    gigabitSignal: 'BI_DA+ (Bidireccional Par A +)',
    poeModeA: 'DC+ (Alimentación +)',
    poeModeB: 'Datos',
    wire568A: 'WG',
    wire568B: 'WO',
  },
  {
    pin: 2,
    fastEthernetSignal: 'TX-',
    fastEthernetRole: 'Transmisión de datos (-)',
    gigabitSignal: 'BI_DA- (Bidireccional Par A -)',
    poeModeA: 'DC+ (Alimentación +)',
    poeModeB: 'Datos',
    wire568A: 'G',
    wire568B: 'O',
  },
  {
    pin: 3,
    fastEthernetSignal: 'RX+',
    fastEthernetRole: 'Recepción de datos (+)',
    gigabitSignal: 'BI_DB+ (Bidireccional Par B +)',
    poeModeA: 'DC- (Retorno -)',
    poeModeB: 'Datos',
    wire568A: 'WO',
    wire568B: 'WG',
  },
  {
    pin: 4,
    fastEthernetSignal: 'No usado',
    fastEthernetRole: 'Reservado / Telefonía / PoE',
    gigabitSignal: 'BI_DC+ (Bidireccional Par C +)',
    poeModeA: 'Datos',
    poeModeB: 'DC+ (Alimentación +)',
    wire568A: 'B',
    wire568B: 'B',
  },
  {
    pin: 5,
    fastEthernetSignal: 'No usado',
    fastEthernetRole: 'Reservado / Telefonía / PoE',
    gigabitSignal: 'BI_DC- (Bidireccional Par C -)',
    poeModeA: 'Datos',
    poeModeB: 'DC+ (Alimentación +)',
    wire568A: 'WB',
    wire568B: 'WB',
  },
  {
    pin: 6,
    fastEthernetSignal: 'RX-',
    fastEthernetRole: 'Recepción de datos (-)',
    gigabitSignal: 'BI_DB- (Bidireccional Par B -)',
    poeModeA: 'DC- (Retorno -)',
    poeModeB: 'Datos',
    wire568A: 'O',
    wire568B: 'G',
  },
  {
    pin: 7,
    fastEthernetSignal: 'No usado',
    fastEthernetRole: 'Reservado / PoE',
    gigabitSignal: 'BI_DD+ (Bidireccional Par D +)',
    poeModeA: 'Datos',
    poeModeB: 'DC- (Retorno -)',
    wire568A: 'WBr',
    wire568B: 'WBr',
  },
  {
    pin: 8,
    fastEthernetSignal: 'No usado',
    fastEthernetRole: 'Reservado / PoE',
    gigabitSignal: 'BI_DD- (Bidireccional Par D -)',
    poeModeA: 'Datos',
    poeModeB: 'DC- (Retorno -)',
    wire568A: 'Br',
    wire568B: 'Br',
  },
];

export type ConnectorStandard =
  | 'T568A'
  | 'T568B'
  | 'CROSS_GIGABIT'
  | 'ROLLOVER'
  | 'CUSTOM'
  | 'INCOMPLETE';

export interface PinTestResult {
  masterPin: number; // 1..8
  wireAtMaster: WireId | null;
  remotePin: number | null; // 1..8 or null if open/disconnected
  shortedRemotePins: number[]; // Additional remote pins lit due to adjacent short circuits
  shortedMasterPins: number[]; // Adjacent master pins shorted with this pin
  status: 'straight' | 'crossed' | 'short' | 'cut' | 'unconnected' | 'un-crimped';
  description: string;
}

export interface CableAnalysis {
  endAStandard: ConnectorStandard;
  endBStandard: ConnectorStandard;
  endALabel: string;
  endBLabel: string;
  isCompleteA: boolean;
  isCompleteB: boolean;
  isCrimpedA: boolean;
  isCrimpedB: boolean;
  cableCategory:
    | 'DIRECT_568B'
    | 'DIRECT_568A'
    | 'CROSSOVER_FAST'
    | 'CROSSOVER_GIGABIT'
    | 'ROLLOVER'
    | 'SPLIT_PAIR_DIRECT'
    | 'FAULTY_SHORT'
    | 'FAULTY_CUT'
    | 'UNCRIMPED'
    | 'INCOMPLETE'
    | 'CUSTOM_INVALID';
  title: string;
  summary: string;
  useCase: string;
  hasSplitPairError: boolean;
  cutWires: WireId[];
  adjacentShorts: number[]; // 1..7 meaning short between Pin k and Pin k+1 on Connector A
  pinResults: PinTestResult[];
  fastEthernetStatus: { ok: boolean; label: string; detail: string };
  gigabitStatus: { ok: boolean; label: string; detail: string };
  poeStatus: { ok: boolean; label: string; detail: string };
}

function arraysEqual(a: (WireId | null)[], b: WireId[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function detectConnectorStandard(slots: (WireId | null)[]): {
  standard: ConnectorStandard;
  label: string;
} {
  if (slots.some((s) => s === null)) {
    const count = slots.filter((s) => s !== null).length;
    return { standard: 'INCOMPLETE', label: `Incompleto (${count}/8 hilos)` };
  }
  if (arraysEqual(slots, STANDARD_T568A)) {
    return { standard: 'T568A', label: 'EIA/TIA-568A' };
  }
  if (arraysEqual(slots, STANDARD_T568B)) {
    return { standard: 'T568B', label: 'EIA/TIA-568B' };
  }
  if (arraysEqual(slots, STANDARD_GIGABIT_CROSS_B)) {
    return { standard: 'CROSS_GIGABIT', label: '568A Cruzado 4-Pares' };
  }
  if (arraysEqual(slots, STANDARD_ROLLOVER_B)) {
    return { standard: 'ROLLOVER', label: 'Inverso Consola (Rollover)' };
  }
  return { standard: 'CUSTOM', label: 'Orden Personalizado (No Estándar)' };
}

/**
 * Checks whether a connector uses valid twisted pairs on pins (1,2), (3,6), (4,5), (7,8)
 * to prevent NEXT (Near-End Crosstalk / Par Dividido).
 */
function hasValidTwistedPairing(slots: (WireId | null)[]): boolean {
  if (slots.some((s) => s === null)) return false;
  const w = slots as WireId[];
  const pairOf = (id: WireId) => WIRES[id].pairNumber;

  const p12 = pairOf(w[0]) === pairOf(w[1]);
  const p36 = pairOf(w[2]) === pairOf(w[5]);
  const p45 = pairOf(w[3]) === pairOf(w[4]);
  const p78 = pairOf(w[6]) === pairOf(w[7]);

  return p12 && p36 && p45 && p78;
}

/**
 * Given a pin (1..8) and a list of adjacent short indices (1..7 where k shorts pin k and k+1),
 * returns all pins electrically bridged to `pin` (excluding `pin` itself).
 */
export function getShortedConnectedPins(pin: number, adjacentShorts: number[]): number[] {
  const connected = new Set<number>([pin]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const s of adjacentShorts) {
      if (connected.has(s) && !connected.has(s + 1)) {
        connected.add(s + 1);
        changed = true;
      }
      if (connected.has(s + 1) && !connected.has(s)) {
        connected.add(s);
        changed = true;
      }
    }
  }
  connected.delete(pin);
  return Array.from(connected).sort((a, b) => a - b);
}

export function analyzeCableConfiguration(
  slotsA: (WireId | null)[],
  slotsB: (WireId | null)[],
  isCrimpedA: boolean,
  isCrimpedB: boolean,
  wireFaults: Record<WireId, WireFault>,
  adjacentShorts: number[] = []
): CableAnalysis {
  const detA = detectConnectorStandard(slotsA);
  const detB = detectConnectorStandard(slotsB);
  const isCompleteA = detA.standard !== 'INCOMPLETE';
  const isCompleteB = detB.standard !== 'INCOMPLETE';

  const cutWires = ALL_WIRE_IDS.filter((id) => wireFaults[id] === 'cut');

  const pinResults: PinTestResult[] = [];
  for (let i = 0; i < 8; i++) {
    const masterPin = i + 1;
    const wire = slotsA[i];
    const shortedMasterPins = getShortedConnectedPins(masterPin, adjacentShorts);

    if (!wire) {
      pinResults.push({
        masterPin,
        wireAtMaster: null,
        remotePin: null,
        shortedRemotePins: [],
        shortedMasterPins,
        status: 'unconnected',
        description: `Pin ${masterPin} vacío en Conector A`,
      });
      continue;
    }

    const remoteIndex = slotsB.indexOf(wire);
    const remotePin = remoteIndex !== -1 ? remoteIndex + 1 : null;

    // Calculate any additional remote pins energized via adjacent shorts
    const shortedRemotePins: number[] = [];
    for (const sPin of shortedMasterPins) {
      const sWire = slotsA[sPin - 1];
      if (sWire && wireFaults[sWire] === 'ok') {
        const rIdx = slotsB.indexOf(sWire);
        if (rIdx !== -1) {
          shortedRemotePins.push(rIdx + 1);
        }
      }
    }

    if (!isCrimpedA || !isCrimpedB) {
      pinResults.push({
        masterPin,
        wireAtMaster: wire,
        remotePin,
        shortedRemotePins,
        shortedMasterPins,
        status: 'un-crimped',
        description: `Falta crimpar cabezal RJ-45 (${WIRES[wire].name})`,
      });
    } else if (wireFaults[wire] === 'cut') {
      pinResults.push({
        masterPin,
        wireAtMaster: wire,
        remotePin: null,
        shortedRemotePins,
        shortedMasterPins,
        status: 'cut',
        description: `Hilo ${WIRES[wire].name} CORTADO (Sin continuidad)`,
      });
    } else if (remotePin === null) {
      pinResults.push({
        masterPin,
        wireAtMaster: wire,
        remotePin: null,
        shortedRemotePins,
        shortedMasterPins,
        status: 'unconnected',
        description: `Hilo ${WIRES[wire].name} no insertado en Conector B`,
      });
    } else if (shortedMasterPins.length > 0) {
      pinResults.push({
        masterPin,
        wireAtMaster: wire,
        remotePin,
        shortedRemotePins,
        shortedMasterPins,
        status: 'short',
        description: `¡CORTOCIRCUITO! Pin ${masterPin} puenteado con Pin ${shortedMasterPins.join(', ')}`,
      });
    } else if (remotePin === masterPin) {
      pinResults.push({
        masterPin,
        wireAtMaster: wire,
        remotePin,
        shortedRemotePins: [],
        shortedMasterPins: [],
        status: 'straight',
        description: `Pin ${masterPin} → Pin ${remotePin} (${WIRES[wire].name}) Directo`,
      });
    } else {
      pinResults.push({
        masterPin,
        wireAtMaster: wire,
        remotePin,
        shortedRemotePins: [],
        shortedMasterPins: [],
        status: 'crossed',
        description: `Pin ${masterPin} → Pin ${remotePin} (${WIRES[wire].name}) Cruzado`,
      });
    }
  }

  const isPinToPinStraight =
    isCompleteA &&
    isCompleteB &&
    slotsA.every((w, idx) => w !== null && w === slotsB[idx]);

  const isFastCrossoverMapping =
    isCompleteA &&
    isCompleteB &&
    slotsA[0] === slotsB[2] &&
    slotsA[1] === slotsB[5] &&
    slotsA[2] === slotsB[0] &&
    slotsA[5] === slotsB[1] &&
    slotsA[3] === slotsB[3] &&
    slotsA[4] === slotsB[4] &&
    slotsA[6] === slotsB[6] &&
    slotsA[7] === slotsB[7];

  const isGigabitCrossoverMapping =
    isCompleteA &&
    isCompleteB &&
    slotsA[0] === slotsB[2] &&
    slotsA[1] === slotsB[5] &&
    slotsA[2] === slotsB[0] &&
    slotsA[5] === slotsB[1] &&
    slotsA[3] === slotsB[6] &&
    slotsA[4] === slotsB[7] &&
    slotsA[6] === slotsB[3] &&
    slotsA[7] === slotsB[4];

  const isRolloverMapping =
    isCompleteA &&
    isCompleteB &&
    slotsA.every((w, idx) => w !== null && w === slotsB[7 - idx]);

  const validPairsA = hasValidTwistedPairing(slotsA);
  const validPairsB = hasValidTwistedPairing(slotsB);
  const hasSplitPairError =
    isCompleteA && isCompleteB && (!validPairsA || !validPairsB) && !isRolloverMapping;

  const fePinsA = [0, 1, 2, 5];
  const feHasShort = fePinsA.some(
    (idx) => getShortedConnectedPins(idx + 1, adjacentShorts).length > 0
  );
  const feWiresIntact =
    isCrimpedA &&
    isCrimpedB &&
    !feHasShort &&
    fePinsA.every((idx) => {
      const w = slotsA[idx];
      return w !== null && wireFaults[w] === 'ok' && slotsB.includes(w);
    });

  const allWiresIntact =
    isCrimpedA &&
    isCrimpedB &&
    isCompleteA &&
    isCompleteB &&
    cutWires.length === 0 &&
    adjacentShorts.length === 0;

  let cableCategory: CableAnalysis['cableCategory'] = 'CUSTOM_INVALID';
  let title = 'Configuración No Estándar';
  let summary = 'El orden de los hilos no coincide con las normas EIA/TIA 568A o 568B.';
  let useCase = 'Revisa el código de colores para evitar fallos de transmisión o diafonía.';

  if (!isCompleteA || !isCompleteB) {
    cableCategory = 'INCOMPLETE';
    title = 'Conector RJ-45 Incompleto';
    summary = 'Inserta los 8 hilos del cable UTP en las ranuras de ambos conectores RJ-45.';
    useCase = 'Arrastra cada hilo de color a su pin correspondiente (1 al 8).';
  } else if (!isCrimpedA || !isCrimpedB) {
    cableCategory = 'UNCRIMPED';
    title = 'Pendiente de Crimpado';
    summary = 'Los 8 hilos están colocados, pero los pines dorados aún no han perforado el aislante.';
    useCase =
      'Pulsa el botón "Crimpar RJ-45" en ambos extremos para fijar los contactos antes de pasar el comprobador o el multímetro.';
  } else if (adjacentShorts.length > 0) {
    cableCategory = 'FAULTY_SHORT';
    const shortLabels = adjacentShorts.map((s) => `Pines ${s}–${s + 1}`).join(', ');
    title = `Cortocircuito Detectado (${shortLabels})`;
    summary = `Existe contacto eléctrico directo entre conductores adyacentes (${shortLabels}). Usa el Multímetro en modo Ohmios/Continuidad para aislar el puente.`;
    useCase =
      'Un cortocircuito bloquea la transmisión diferencial y puede disparar la protección de sobrecorriente en switches PoE.';
  } else if (cutWires.length > 0) {
    cableCategory = 'FAULTY_CUT';
    title = `Avería Detectada: ${cutWires.length} Hilo(s) Cortado(s)`;
    summary = `El comprobador detecta circuito abierto (OL MΩ) en: ${cutWires
      .map((w) => WIRES[w].name)
      .join(', ')}.`;
    useCase =
      'En el taller real, un hilo partido obliga a cortar el cabezal o reparar el tramo dañado.';
  } else if (detA.standard === 'T568B' && detB.standard === 'T568B') {
    cableCategory = 'DIRECT_568B';
    title = 'Cable Directo (Norma EIA/TIA-568B)';
    summary =
      'Continuidad 1 a 1 perfecta con pares trenzados balanceados según el estándar comercial más extendido.';
    useCase =
      'Ideal para conectar dispositivos distintos: PC a Switch, Router a Switch, Punto de Acceso Wi-Fi o Cámara IP PoE.';
  } else if (detA.standard === 'T568A' && detB.standard === 'T568A') {
    cableCategory = 'DIRECT_568A';
    title = 'Cable Directo (Norma EIA/TIA-568A)';
    summary =
      'Continuidad 1 a 1 perfecta bajo norma T568A, habitual en instalaciones institucionales y residenciales.';
    useCase =
      'Conecta equipos de distinta capa (PC a Switch, Router a Switch, Roseta mural a Panel de Parcheo 568A).';
  } else if (
    (detA.standard === 'T568A' && detB.standard === 'T568B') ||
    (detA.standard === 'T568B' && detB.standard === 'T568A')
  ) {
    cableCategory = 'CROSSOVER_FAST';
    title = 'Cable Cruzado (Crossover 568A ↔ 568B)';
    summary =
      'Cruza el par Naranja con el par Verde (Pines 1-2 ↔ 3-6) manteniendo fijos los pares Azul (4-5) y Marrón (7-8).';
    useCase =
      'Conecta equipos iguales directamente: PC a PC, Switch a Switch o Router a Router (sin Auto-MDI/MDIX).';
  } else if (isGigabitCrossoverMapping && validPairsA && validPairsB) {
    cableCategory = 'CROSSOVER_GIGABIT';
    title = 'Cable Cruzado Gigabit Completo (4 Pares)';
    summary =
      'Cruza tanto los pares de datos principales (1-2 ↔ 3-6) como los pares secundarios (4-5 ↔ 7-8).';
    useCase =
      'Conexión directa de alta velocidad 1000BASE-T entre dos tarjetas o equipos Gigabit sin Auto-MDIX.';
  } else if (isRolloverMapping) {
    cableCategory = 'ROLLOVER';
    title = 'Cable Consola / Rollover (Pines 1–8 a 8–1)';
    summary =
      'Todos los pines están completamente invertidos de un extremo al otro (Pin 1 al 8, Pin 2 al 7, etc.).';
    useCase =
      'Administración por puerto serie RS-232 / Consola en routers y switches gestionables (ej. Cisco IOS).';
  } else if (isPinToPinStraight && hasSplitPairError) {
    cableCategory = 'SPLIT_PAIR_DIRECT';
    title = '¡Peligro Didáctico! Cable con Par Dividido (Split Pair)';
    summary =
      'Aunque el tester LED básico ilumina 1→1 hasta 8→8 en orden, los pines 3 y 6 NO usan el mismo par trenzado físico.';
    useCase =
      'Provoca diafonía severa (NEXT), pérdida masiva de paquetes e imposibilidad de enlazar a 100 Mbps o 1 Gbps en tramos largos.';
  }

  let fastEthernetStatus = {
    ok: false,
    label: 'Sin Enlace 100M',
    detail: 'Revisa los pines 1, 2, 3 y 6.',
  };

  if (feHasShort) {
    fastEthernetStatus = {
      ok: false,
      label: 'Corto en Par TX/RX',
      detail: 'Cortocircuito activo afectando a los pines de datos 1, 2, 3 o 6.',
    };
  } else if (
    feWiresIntact &&
    (isPinToPinStraight || isFastCrossoverMapping || isGigabitCrossoverMapping) &&
    !hasSplitPairError
  ) {
    fastEthernetStatus = {
      ok: true,
      label: '100BASE-TX OK',
      detail: 'Pines activos 1-2 (TX) y 3-6 (RX) correctamente trenzados y sin cortocircuitos.',
    };
  } else if (feWiresIntact && isPinToPinStraight && hasSplitPairError) {
    fastEthernetStatus = {
      ok: false,
      label: 'Fallo por Diafonía (Split Pair)',
      detail: 'Continuidad eléctrica en 1,2,3,6 pero sin cancelación electromagnética en el par 3-6.',
    };
  } else if (isCrimpedA && isCrimpedB && !feWiresIntact && isCompleteA && isCompleteB) {
    fastEthernetStatus = {
      ok: false,
      label: 'Sin Continuidad TX/RX',
      detail: 'Alguno de los hilos en los pines críticos 1, 2, 3 o 6 está cortado o mal conectado.',
    };
  }

  let gigabitStatus = {
    ok: false,
    label: 'Sin Enlace 1 Gbps',
    detail: 'Gigabit requiere los 8 hilos íntegros, sin cortos y 4 pares balanceados.',
  };

  if (
    allWiresIntact &&
    (isPinToPinStraight || isFastCrossoverMapping || isGigabitCrossoverMapping) &&
    !hasSplitPairError
  ) {
    gigabitStatus = {
      ok: true,
      label: '1000BASE-T OK',
      detail: 'Los 4 pares bidireccionales (Pines 1–8) tienen continuidad total y aislamiento óptimo.',
    };
  } else if (adjacentShorts.length > 0) {
    gigabitStatus = {
      ok: false,
      label: 'Fallo por Cortocircuito',
      detail: 'Un puente entre hilos adyacentes impide la modulación PAM-5 de Gigabit Ethernet.',
    };
  } else if (fastEthernetStatus.ok && !allWiresIntact) {
    gigabitStatus = {
      ok: false,
      label: 'Degradado a 100 Mbps',
      detail: 'Fallo en pares 4-5 o 7-8: el enlace cae de 1 Gbps a 100 Mbps (Fast Ethernet).',
    };
  }

  let poeStatus = {
    ok: false,
    label: 'PoE No Seguro',
    detail: 'Requiere continuidad y ausencia total de cortocircuitos.',
  };

  if (adjacentShorts.length > 0) {
    poeStatus = {
      ok: false,
      label: '¡Peligro Corto PoE!',
      detail: 'El switch PoE bloqueará la alimentación (OCP) al detectar baja impedancia por cortocircuito.',
    };
  } else if (allWiresIntact && (isPinToPinStraight || isFastCrossoverMapping) && !hasSplitPairError) {
    poeStatus = {
      ok: true,
      label: 'PoE 802.3af/at OK',
      detail: 'Soporta alimentación eléctrica tanto en Modo A (1-2, 3-6) como en Modo B (4-5, 7-8).',
    };
  } else if (feWiresIntact && (isPinToPinStraight || isFastCrossoverMapping) && !hasSplitPairError) {
    poeStatus = {
      ok: true,
      label: 'Solo PoE Modo A',
      detail: 'Operativo únicamente en Modo A (pines 1-2 y 3-6); Modo B inactivo por fallo en 4-5 o 7-8.',
    };
  }

  return {
    endAStandard: detA.standard,
    endBStandard: detB.standard,
    endALabel: detA.label,
    endBLabel: detB.label,
    isCompleteA,
    isCompleteB,
    isCrimpedA,
    isCrimpedB,
    cableCategory,
    title,
    summary,
    useCase,
    hasSplitPairError,
    cutWires,
    adjacentShorts,
    pinResults,
    fastEthernetStatus,
    gigabitStatus,
    poeStatus,
  };
}

export interface ChallengeItem {
  id: string;
  number: string;
  title: string;
  difficulty: 'Básico' | 'Intermedio' | 'Avanzado';
  scenario: string;
  objective: string;
  hint: string;
  setup?: {
    slotsA: (WireId | null)[];
    slotsB: (WireId | null)[];
    crimpedA: boolean;
    crimpedB: boolean;
    faults: Record<WireId, WireFault>;
    adjacentShorts?: number[];
  };
  verify: (analysis: CableAnalysis) => { passed: boolean; feedback: string };
}

export const CHALLENGES: ChallengeItem[] = [
  {
    id: 'direct-568b',
    number: '01',
    title: 'Latiguillo Estándar de Oficina (Directo T568B)',
    difficulty: 'Básico',
    scenario:
      'Necesitas conectar un ordenador de sobremesa (PC) a una boca del Switch principal del aula utilizando el estándar comercial más habitual en Europa y América.',
    objective:
      'Cablea ambos conectores RJ-45 siguiendo la norma EIA/TIA-568B, asegúrate de que todos los hilos estén sanos y crimpa ambos extremos.',
    hint: 'En T568B el orden del Pin 1 al 8 es: Blanco-Naranja, Naranja, Blanco-Verde, Azul, Blanco-Azul, Verde, Blanco-Marrón, Marrón.',
    verify: (a) => {
      if (a.cableCategory === 'DIRECT_568B') {
        return {
          passed: true,
          feedback:
            '¡Excelente trabajo! Has construido y crimpado un cable directo T568B perfecto, listo para enlaces Gigabit y PoE.',
        };
      }
      return {
        passed: false,
        feedback: `Aún no cumple el objetivo. Estado actual: ${a.title}. Asegúrate de usar T568B en ambos extremos y crimpar los dos conectores.`,
      };
    },
  },
  {
    id: 'direct-568a',
    number: '02',
    title: 'Instalación Normativa Residencial (Directo T568A)',
    difficulty: 'Básico',
    scenario:
      'Estás certificando una red en un edificio público donde todo el panel de parcheo está terminado bajo la norma EIA/TIA-568A.',
    objective:
      'Construye y crimpa un cable directo íntegro empleando la norma EIA/TIA-568A en ambos extremos.',
    hint: 'En T568A el par Verde inicia en los pines 1 y 2 (Blanco-Verde, Verde) y el par Naranja ocupa los pines 3 y 6 (Blanco-Naranja en el 3, Naranja en el 6).',
    verify: (a) => {
      if (a.cableCategory === 'DIRECT_568A') {
        return {
          passed: true,
          feedback:
            '¡Correcto! El latiguillo directo T568A mantiene la coherencia cromática con los paneles de parcheo de la instalación.',
        };
      }
      return {
        passed: false,
        feedback: `Estado actual: ${a.title}. Debes aplicar T568A tanto en el Conector 1 como en el Conector 2 y crimparlos.`,
      };
    },
  },
  {
    id: 'crossover-fast',
    number: '03',
    title: 'Enlace Directo entre Equipos Iguales (Cable Cruzado)',
    difficulty: 'Intermedio',
    scenario:
      'Debes interconectar dos switches antiguos de laboratorio que carecen de función Auto-MDI/MDIX, por lo que necesitas cruzar los pares de transmisión (TX) y recepción (RX).',
    objective:
      'Construye un cable cruzado estándar combinando T568A en un extremo y T568B en el otro, y crimpa ambos conectores.',
    hint: 'Configura un conector en norma T568A y el otro conector en norma T568B. Al probarlo en el Tester LED verás que el Pin 1 salta al 3 y el Pin 2 salta al 6.',
    verify: (a) => {
      if (a.cableCategory === 'CROSSOVER_FAST') {
        return {
          passed: true,
          feedback:
            '¡Perfecto! Al combinar 568A y 568B has cruzado los pines 1-2 (TX) con los pines 3-6 (RX) limpiamente.',
        };
      }
      return {
        passed: false,
        feedback: `Estado actual: ${a.title}. Recuerda: un extremo debe ser T568A y el otro T568B, ambos crimpados.`,
      };
    },
  },
  {
    id: 'troubleshoot-fault',
    number: '04',
    title: 'Diagnóstico con Multímetro: Hilo Cortado y Cortocircuito',
    difficulty: 'Intermedio',
    scenario:
      'Un cable T568B hace saltar la protección PoE del Switch y no levanta enlace. Hay un cortocircuito entre dos pines adyacentes, un hilo cortado y los pines 7-8 están invertidos en el Conector 2.',
    objective:
      'Usa el Multímetro (Ω) para localizar el cortocircuito y el par abierto (OL), elimina el cortocircuito, sanea el hilo cortado y corrige el Conector 2 a T568B.',
    hint: 'Abre la pestaña «Multímetro (Ω)» en el comprobador para medir la resistencia de cada par y detectar el cortocircuito en Pines 1–2 y el hilo Azul cortado.',
    setup: {
      slotsA: ['WO', 'O', 'WG', 'B', 'WB', 'G', 'WBr', 'Br'],
      slotsB: ['WO', 'O', 'WG', 'B', 'WB', 'G', 'Br', 'WBr'],
      crimpedA: true,
      crimpedB: true,
      faults: {
        WO: 'ok',
        O: 'ok',
        WG: 'ok',
        B: 'cut',
        WB: 'ok',
        G: 'ok',
        WBr: 'ok',
        Br: 'ok',
      },
      adjacentShorts: [1],
    },
    verify: (a) => {
      if (a.cableCategory === 'DIRECT_568B') {
        return {
          passed: true,
          feedback:
            '¡Diagnóstico y reparación impecables! Has eliminado el cortocircuito en Pines 1–2, saneado el hilo Azul y corregido los pines 7 y 8.',
        };
      }
      return {
        passed: false,
        feedback: `El cable sigue presentando fallos: ${a.title}. Elimina todos los cortocircuitos, repara los hilos cortados y deja ambos extremos en T568B.`,
      };
    },
  },
  {
    id: 'rollover-console',
    number: '05',
    title: 'Cable de Consola Cisco (Rollover 1–8 a 8–1)',
    difficulty: 'Avanzado',
    scenario:
      'Necesitas configurar por puerto de consola un router empresarial desde cero. Para ello debes fabricar un cable Rollover donde el Pin 1 del extremo A llegue al Pin 8 del extremo B, el 2 al 7, y así sucesivamente.',
    objective:
      'Coloca T568B en el Conector 1 y el orden completamente invertido (Pin 8 a Pin 1) en el Conector 2, y crimpa ambos.',
    hint: 'Si el Conector 1 empieza por Blanco-Naranja en el Pin 1 y termina con Marrón en el Pin 8, el Conector 2 debe empezar por Marrón en el Pin 1 y terminar con Blanco-Naranja en el Pin 8.',
    verify: (a) => {
      if (a.cableCategory === 'ROLLOVER') {
        return {
          passed: true,
          feedback:
            '¡Impecable! En el Tester LED puedes observar la característica escalera inversa del Pin 1 al 8 en el Maestro frente al 8 al 1 en el Remoto.',
        };
      }
      return {
        passed: false,
        feedback: `Estado actual: ${a.title}. Invierte exactamente el orden de los 8 hilos entre el Conector 1 y el Conector 2.`,
      };
    },
  },
];
