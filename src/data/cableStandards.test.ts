import { describe, expect, it } from 'vitest';
import {
  ALL_WIRE_IDS,
  CHALLENGES,
  PIN_SPECS,
  STANDARD_GIGABIT_CROSS_B,
  STANDARD_ROLLOVER_B,
  STANDARD_T568A,
  STANDARD_T568B,
  WIRES,
  WireFault,
  WireId,
  analyzeCableConfiguration,
  detectConnectorStandard,
  getShortedConnectedPins,
} from './cableStandards';

const OK: Record<WireId, WireFault> = Object.fromEntries(ALL_WIRE_IDS.map((w) => [w, 'ok'])) as Record<WireId, WireFault>;
const analyze = (a: WireId[], b: (WireId | null)[], opts: { faults?: Partial<Record<WireId, WireFault>>; shorts?: number[]; crimp?: [boolean, boolean] } = {}) =>
  analyzeCableConfiguration(a, b, opts.crimp?.[0] ?? true, opts.crimp?.[1] ?? true, { ...OK, ...opts.faults }, opts.shorts ?? []);
const pairOf = (w: WireId) => WIRES[w].pairNumber;

describe('normas TIA/EIA-568', () => {
  it('T568B: blanco-naranja, naranja, blanco-verde, azul, blanco-azul, verde, blanco-marrón, marrón', () => {
    expect(STANDARD_T568B.map((w) => WIRES[w].name)).toEqual(['Blanco-Naranja', 'Naranja', 'Blanco-Verde', 'Azul', 'Blanco-Azul', 'Verde', 'Blanco-Marrón', 'Marrón']);
  });

  it('T568A: intercambia el par naranja y el verde respecto a T568B', () => {
    expect(STANDARD_T568A.map((w) => WIRES[w].name)).toEqual(['Blanco-Verde', 'Verde', 'Blanco-Naranja', 'Azul', 'Blanco-Azul', 'Naranja', 'Blanco-Marrón', 'Marrón']);
  });

  it.each([['T568A', STANDARD_T568A], ['T568B', STANDARD_T568B]] as const)('%s: cada par trenzado ocupa 1-2, 3-6, 4-5 y 7-8', (_n, std) => {
    for (const [x, y] of [[0, 1], [2, 5], [3, 4], [6, 7]]) expect(pairOf(std[x])).toBe(pairOf(std[y]));
    expect(new Set(std).size).toBe(8);
  });

  it('la tabla de pines coincide con las dos normas', () => {
    PIN_SPECS.forEach((p, i) => {
      expect(p.wire568A).toBe(STANDARD_T568A[i]);
      expect(p.wire568B).toBe(STANDARD_T568B[i]);
    });
    expect(PIN_SPECS.filter((p) => /^TX|^RX/.test(p.fastEthernetSignal)).map((p) => p.pin)).toEqual([1, 2, 3, 6]);
  });

  it('cruzado Gigabit: 1↔3, 2↔6, 4↔7 y 5↔8 respecto a T568B', () => {
    const map = [3, 6, 1, 7, 8, 2, 4, 5];
    STANDARD_T568B.forEach((w, i) => expect(STANDARD_GIGABIT_CROSS_B[map[i] - 1]).toBe(w));
  });

  it('rollover: orden inverso de T568B', () => {
    expect(STANDARD_ROLLOVER_B).toEqual([...STANDARD_T568B].reverse());
  });
});

describe('análisis del cable', () => {
  it('directo T568B: Fast Ethernet, Gigabit y PoE correctos', () => {
    const r = analyze(STANDARD_T568B, STANDARD_T568B);
    expect(r.cableCategory).toBe('DIRECT_568B');
    expect([r.fastEthernetStatus.ok, r.gigabitStatus.ok, r.poeStatus.ok]).toEqual([true, true, true]);
    expect(r.pinResults.every((p) => p.status === 'straight')).toBe(true);
  });

  it('cruzado 568A↔568B: el pin 1 llega al 3 y el 2 al 6', () => {
    const r = analyze(STANDARD_T568A, STANDARD_T568B);
    expect(r.cableCategory).toBe('CROSSOVER_FAST');
    expect(r.pinResults[0].remotePin).toBe(3);
    expect(r.pinResults[1].remotePin).toBe(6);
    expect(r.fastEthernetStatus.ok).toBe(true);
  });

  it('cruzado Gigabit de 4 pares', () => {
    expect(analyze(STANDARD_T568B, STANDARD_GIGABIT_CROSS_B).cableCategory).toBe('CROSSOVER_GIGABIT');
  });

  it('rollover: cable de consola, no sirve para Ethernet', () => {
    const r = analyze(STANDARD_T568B, STANDARD_ROLLOVER_B);
    expect(r.cableCategory).toBe('ROLLOVER');
    expect(r.pinResults.map((p) => p.remotePin)).toEqual([8, 7, 6, 5, 4, 3, 2, 1]);
    expect(r.fastEthernetStatus.ok).toBe(false);
  });

  it('par dividido: el tester LED da 1-1…8-8, pero no hay enlace', () => {
    const split: WireId[] = ['WO', 'O', 'WG', 'G', 'WB', 'B', 'WBr', 'Br'];
    const r = analyze(split, split);
    expect(r.cableCategory).toBe('SPLIT_PAIR_DIRECT');
    expect(r.pinResults.every((p) => p.status === 'straight')).toBe(true);
    expect(r.fastEthernetStatus.ok).toBe(false);
    expect(r.gigabitStatus.ok).toBe(false);
  });

  it('hilo marrón cortado: Fast Ethernet sí, Gigabit cae a 100 Mbps, PoE solo modo A', () => {
    const r = analyze(STANDARD_T568B, STANDARD_T568B, { faults: { Br: 'cut' } });
    expect(r.cableCategory).toBe('FAULTY_CUT');
    expect(r.fastEthernetStatus.ok).toBe(true);
    expect(r.gigabitStatus.label).toBe('Degradado a 100 Mbps');
    expect(r.poeStatus.label).toBe('Solo PoE Modo A');
  });

  it('cortocircuito en 1-2: sin enlace y peligro PoE', () => {
    const r = analyze(STANDARD_T568B, STANDARD_T568B, { shorts: [1] });
    expect(r.cableCategory).toBe('FAULTY_SHORT');
    expect(r.fastEthernetStatus.ok).toBe(false);
    expect(r.poeStatus.label).toContain('Peligro');
    expect(getShortedConnectedPins(1, [1, 2])).toEqual([2, 3]);
  });

  it('sin crimpar o incompleto no da enlace', () => {
    expect(analyze(STANDARD_T568B, STANDARD_T568B, { crimp: [true, false] }).cableCategory).toBe('UNCRIMPED');
    expect(analyze(STANDARD_T568B, [...STANDARD_T568B.slice(0, 6), null, null]).cableCategory).toBe('INCOMPLETE');
  });

  it('5.000 conectores al azar: si hay par dividido nunca hay enlace', () => {
    for (let i = 0; i < 5000; i++) {
      const order = [...ALL_WIRE_IDS].sort(() => Math.random() - 0.5);
      const r = analyze(order, order);
      if (r.hasSplitPairError) expect(r.fastEthernetStatus.ok || r.gigabitStatus.ok).toBe(false);
      const det = detectConnectorStandard(order).standard;
      if (det === 'T568A' || det === 'T568B') expect(r.hasSplitPairError).toBe(false);
    }
  });
});

describe('retos', () => {
  const solucion: Record<string, [WireId[], WireId[]]> = {
    'direct-568b': [STANDARD_T568B, STANDARD_T568B],
    'direct-568a': [STANDARD_T568A, STANDARD_T568A],
    'crossover-fast': [STANDARD_T568A, STANDARD_T568B],
    'troubleshoot-fault': [STANDARD_T568B, STANDARD_T568B],
    'rollover-console': [STANDARD_T568B, STANDARD_ROLLOVER_B],
  };

  it.each(CHALLENGES.map((c) => [c.number, c] as const))('reto %s: se supera con el cable correcto y no con la mesa vacía ni sin crimpar', (_n, ch) => {
    const [a, b] = solucion[ch.id];
    expect(ch.verify(analyze(a, b)).passed).toBe(true);
    expect(ch.verify(analyze(a, b, { crimp: [true, false] })).passed).toBe(false);
    expect(ch.verify(analyzeCableConfiguration(Array(8).fill(null), Array(8).fill(null), false, false, OK, [])).passed).toBe(false);
  });

  it('reto 04: el montaje inicial tiene corto, hilo cortado y 7-8 invertidos', () => {
    const ch = CHALLENGES.find((c) => c.id === 'troubleshoot-fault')!;
    const s = ch.setup!;
    const r = analyzeCableConfiguration(s.slotsA, s.slotsB, s.crimpedA, s.crimpedB, s.faults, s.adjacentShorts);
    expect(r.cableCategory).toBe('FAULTY_SHORT');
    expect(r.cutWires).toEqual(['B']);
    expect(ch.verify(r).passed).toBe(false);
    // quitar solo el corto y el corte no basta: falta corregir 7-8 en el conector 2
    const casi = analyzeCableConfiguration(s.slotsA, s.slotsB, true, true, OK, []);
    expect(ch.verify(casi).passed).toBe(false);
  });
});
