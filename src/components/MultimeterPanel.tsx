import React, { useEffect, useRef, useState } from 'react';
import {
  CableAnalysis,
  getShortedConnectedPins,
  TWISTED_PAIRS_SPEC,
  WIRES,
  WireFault,
  WireId,
} from '../data/cableStandards';
import { WireVisual } from './WireSwatch';
import { soundFX } from '../utils/soundEffects';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Play,
  Radio,
  RotateCcw,
  Wrench,
  Zap,
} from 'lucide-react';

interface MultimeterPanelProps {
  slotsA: (WireId | null)[];
  slotsB: (WireId | null)[];
  isCrimpedA: boolean;
  isCrimpedB: boolean;
  wireFaults: Record<WireId, WireFault>;
  adjacentShorts: number[];
  analysis: CableAnalysis;
  onChangeProbePins: (pins: [number, number] | null) => void;
  onToggleAdjacentShort: (pinLeft: number) => void;
}

export interface PairMeasurementResult {
  pairNumber: 1 | 2 | 3 | 4;
  pairName: string;
  pinsA: [number | null, number | null];
  status: 'nominal' | 'short_near' | 'short_cross' | 'open_cut' | 'uncrimped';
  resistanceOhms: number | null; // null = OL (Open Loop)
  propagationDelayNs: number;
  displayValue: string;
  verdict: string;
  delayMs: number;
}

export interface AdjacentShortResult {
  pinLeft: number;
  pinRight: number;
  wires: [WireId | null, WireId | null];
  isShorted: boolean;
  resistanceOhms: number | null; // null = OL (>500 MOhm)
  displayValue: string;
  verdict: string;
  delayMs: number;
}

export type CableCategorySpec = 'CAT5E' | 'CAT6' | 'CAT6A';

export const MultimeterPanel: React.FC<MultimeterPanelProps> = ({
  slotsA,
  slotsB,
  isCrimpedA,
  isCrimpedB,
  wireFaults,
  adjacentShorts,
  analysis,
  onChangeProbePins,
  onToggleAdjacentShort,
}) => {
  // Simulated UTP cable length in meters (affects loop resistance: ~0.168 Ohm/m per pair loop for AWG 24)
  const [cableLengthMeters, setCableLengthMeters] = useState<number>(15);
  const [cableCat, setCableCat] = useState<CableCategorySpec>('CAT6');
  // Simulated distance of cut fault along the cable (percentage of total length)
  const [cutDistanceRatio, setCutDistanceRatio] = useState<number>(0.62);

  // Active measurement state with realistic random delay
  const [isMeasuring, setIsMeasuring] = useState<boolean>(false);
  const [transientReading, setTransientReading] = useState<string>('---.- Ω');
  const [lcdMainValue, setLcdMainValue] = useState<string>('LISTO');
  const [lcdSubLabel, setLcdSubLabel] = useState<string>(
    'Selecciona un par, pines adyacentes o «Medir Todo»'
  );
  const [lcdStatus, setLcdStatus] = useState<'idle' | 'ok' | 'short' | 'open'>('idle');
  const [lastDelayMs, setLastDelayMs] = useState<number | null>(null);

  // Stored results for the 4 twisted pairs and 7 adjacent pin pairs
  const [pairResults, setPairResults] = useState<Record<number, PairMeasurementResult>>({});
  const [adjacentResults, setAdjacentResults] = useState<Record<number, AdjacentShortResult>>({});

  // Manual Probe Pin selector (Red V/Ω and Black COM)
  const [probeRedPin, setProbeRedPin] = useState<number>(1);
  const [probeBlackPin, setProbeBlackPin] = useState<number>(2);

  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      onChangeProbePins(null);
    };
  }, [onChangeProbePins]);

  // Clear cached measurements when cable geometry or faults change
  useEffect(() => {
    setPairResults({});
    setAdjacentResults({});
  }, [
    slotsA,
    slotsB,
    isCrimpedA,
    isCrimpedB,
    wireFaults,
    adjacentShorts,
    cableLengthMeters,
    cableCat,
  ]);

  // Resistance per meter factor depending on Category AWG (Cat5e AWG24 = 0.084, Cat6 AWG23 = 0.068, Cat6A AWG23 = 0.065)
  const ohmPerMeterConductor =
    cableCat === 'CAT5E' ? 0.084 : cableCat === 'CAT6' ? 0.072 : 0.066;

  /**
   * Computes realistic DC loop resistance and propagation delay for a given physical twisted pair
   */
  const computePairMeasurement = (pairNumber: 1 | 2 | 3 | 4): PairMeasurementResult => {
    const spec = TWISTED_PAIRS_SPEC.find((p) => p.pairNumber === pairNumber)!;
    const pinPosA = slotsA.indexOf(spec.positiveWire) + 1 || null;
    const pinNegA = slotsA.indexOf(spec.negativeWire) + 1 || null;
    const pinPosB = slotsB.indexOf(spec.positiveWire) + 1 || null;
    const pinNegB = slotsB.indexOf(spec.negativeWire) + 1 || null;

    // Random realistic settling time between 380ms and 790ms
    const delayMs = Math.floor(380 + Math.random() * 410);
    const jitter = (Math.random() - 0.5) * 0.06;
    const pitch = WIRES[spec.positiveWire].twistPitchFactor;
    // NVP = 0.69c => ~4.83 ns per meter one-way
    const propagationDelayNs = Math.max(
      1,
      Math.round(cableLengthMeters * 4.83 * pitch)
    );

    if (!pinPosA || !pinNegA || !pinPosB || !pinNegB) {
      return {
        pairNumber,
        pairName: spec.name,
        pinsA: [pinPosA, pinNegA],
        status: 'open_cut',
        resistanceOhms: null,
        propagationDelayNs,
        displayValue: 'OL MΩ',
        verdict: 'Hilos del par no insertados en ambos conectores',
        delayMs,
      };
    }

    if (!isCrimpedA || !isCrimpedB) {
      return {
        pairNumber,
        pairName: spec.name,
        pinsA: [pinPosA, pinNegA],
        status: 'uncrimped',
        resistanceOhms: null,
        propagationDelayNs,
        displayValue: 'OL MΩ',
        verdict: 'Sin contacto en cuchillas (Falta crimpar RJ-45)',
        delayMs,
      };
    }

    // Check if the two pins of this pair are directly shorted together at Connector A
    const shortedFromPos = getShortedConnectedPins(pinPosA, adjacentShorts);
    if (shortedFromPos.includes(pinNegA)) {
      const shortRes = Number((0.09 + Math.random() * 0.08).toFixed(2));
      return {
        pairNumber,
        pairName: spec.name,
        pinsA: [pinPosA, pinNegA],
        status: 'short_near',
        resistanceOhms: shortRes,
        propagationDelayNs: 1,
        displayValue: `${shortRes.toFixed(2)} Ω`,
        verdict: `¡CORTOCIRCUITO en Pines ${pinPosA}–${pinNegA}! Resistencia anormalmente baja`,
        delayMs,
      };
    }

    // Check if either wire is cut
    if (
      wireFaults[spec.positiveWire] === 'cut' ||
      wireFaults[spec.negativeWire] === 'cut'
    ) {
      const cutNames = [spec.positiveWire, spec.negativeWire]
        .filter((w) => wireFaults[w] === 'cut')
        .map((w) => WIRES[w].shortName)
        .join(' y ');
      const cutMeters = (cableLengthMeters * cutDistanceRatio).toFixed(1);
      return {
        pairNumber,
        pairName: spec.name,
        pinsA: [pinPosA, pinNegA],
        status: 'open_cut',
        resistanceOhms: null,
        propagationDelayNs,
        displayValue: 'OL MΩ',
        verdict: `Abierto: ${cutNames} cortado a ${cutMeters} m (TDR)`,
        delayMs,
      };
    }

    // Check if either pin is shorted to an adjacent pin belonging to another pair
    const shortedFromNeg = getShortedConnectedPins(pinNegA, adjacentShorts);
    if (shortedFromPos.length > 0 || shortedFromNeg.length > 0) {
      const affected = Array.from(new Set([...shortedFromPos, ...shortedFromNeg])).join(', ');
      const crossRes = Number(
        (cableLengthMeters * 0.11 + 0.15 + Math.abs(jitter)).toFixed(2)
      );
      return {
        pairNumber,
        pairName: spec.name,
        pinsA: [pinPosA, pinNegA],
        status: 'short_cross',
        resistanceOhms: crossRes,
        propagationDelayNs,
        displayValue: `${crossRes.toFixed(2)} Ω`,
        verdict: `Derivación detectada con Pin ${affected} (Fuga por corto adyacente)`,
        delayMs,
      };
    }

    // Nominal loop resistance: 2 * length * ohmPerMeterConductor * twistPitchFactor + 0.08 Ohm contact resistance
    const nominalRes = Number(
      (cableLengthMeters * 2 * ohmPerMeterConductor * pitch + 0.08 + jitter).toFixed(2)
    );

    return {
      pairNumber,
      pairName: spec.name,
      pinsA: [pinPosA, pinNegA],
      status: 'nominal',
      resistanceOhms: nominalRes,
      propagationDelayNs,
      displayValue: `${nominalRes.toFixed(2)} Ω`,
      verdict: `Bucle cerrado OK (${propagationDelayNs} ns)`,
      delayMs,
    };
  };

  /**
   * Computes insulation / short-circuit measurement between adjacent pins (pinLeft and pinLeft + 1)
   */
  const computeAdjacentMeasurement = (pinLeft: number): AdjacentShortResult => {
    const pinRight = pinLeft + 1;
    const wLeft = slotsA[pinLeft - 1] || null;
    const wRight = slotsA[pinRight - 1] || null;
    const delayMs = Math.floor(340 + Math.random() * 440);

    const isShorted = adjacentShorts.includes(pinLeft) && isCrimpedA;

    if (isShorted) {
      const contactOhms = Number((0.08 + Math.random() * 0.14).toFixed(2));
      return {
        pinLeft,
        pinRight,
        wires: [wLeft, wRight],
        isShorted: true,
        resistanceOhms: contactOhms,
        displayValue: `${contactOhms.toFixed(2)} Ω`,
        verdict: `¡CORTOCIRCUITO DIRECTO entre Pin ${pinLeft} y Pin ${pinRight}!`,
        delayMs,
      };
    }

    return {
      pinLeft,
      pinRight,
      wires: [wLeft, wRight],
      isShorted: false,
      resistanceOhms: null,
      displayValue: 'OL (>500 MΩ)',
      verdict: `Aislamiento correcto entre Pin ${pinLeft} y Pin ${pinRight}`,
      delayMs,
    };
  };

  /**
   * Runs a single measurement with simulated auto-ranging delay on the LCD
   */
  const runSimulatedMeasurement = (
    probes: [number, number] | null,
    delayMs: number,
    onComplete: () => void
  ) => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    if (intervalRef.current) window.clearInterval(intervalRef.current);

    soundFX.playMultimeterProbeClick();
    setIsMeasuring(true);
    setLastDelayMs(delayMs);
    onChangeProbePins(probes);

    setTransientReading('184.2 Ω');

    intervalRef.current = window.setInterval(() => {
      setTransientReading(`${(Math.random() * 60 + 1.2).toFixed(1)} Ω`);
    }, 110);

    timeoutRef.current = window.setTimeout(() => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      setIsMeasuring(false);
      onComplete();
    }, delayMs);
  };

  const handleMeasureSinglePair = (pairNumber: 1 | 2 | 3 | 4) => {
    const res = computePairMeasurement(pairNumber);
    const probes: [number, number] | null =
      res.pinsA[0] && res.pinsA[1] ? [res.pinsA[0], res.pinsA[1]] : null;

    if (probes) {
      setProbeRedPin(probes[0]);
      setProbeBlackPin(probes[1]);
    }

    runSimulatedMeasurement(probes, res.delayMs, () => {
      setPairResults((prev) => ({ ...prev, [pairNumber]: res }));
      setLcdMainValue(res.displayValue);
      setLcdSubLabel(`${res.pairName}: ${res.verdict}`);

      if (res.status === 'nominal') {
        setLcdStatus('ok');
        soundFX.playMultimeterBeep('normal');
      } else if (res.status === 'short_near' || res.status === 'short_cross') {
        setLcdStatus('short');
        soundFX.playMultimeterBeep('short_alarm');
      } else {
        setLcdStatus('open');
        soundFX.playMultimeterBeep('open');
      }
    });
  };

  const handleMeasureAdjacentPinPair = (pinLeft: number) => {
    const res = computeAdjacentMeasurement(pinLeft);
    const probes: [number, number] = [pinLeft, pinLeft + 1];
    setProbeRedPin(pinLeft);
    setProbeBlackPin(pinLeft + 1);

    runSimulatedMeasurement(probes, res.delayMs, () => {
      setAdjacentResults((prev) => ({ ...prev, [pinLeft]: res }));
      setLcdMainValue(res.displayValue);
      setLcdSubLabel(`Pines Adyacentes ${pinLeft}–${pinLeft + 1}: ${res.verdict}`);

      if (res.isShorted) {
        setLcdStatus('short');
        soundFX.playMultimeterBeep('short_alarm');
      } else {
        setLcdStatus('ok');
        soundFX.playMultimeterBeep('normal');
      }
    });
  };

  const handleMeasureCustomProbes = () => {
    if (probeRedPin === probeBlackPin) {
      runSimulatedMeasurement([probeRedPin, probeBlackPin], 380, () => {
        setLcdMainValue('0.02 Ω');
        setLcdSubLabel(
          `Puntas Roja y Negra en el mismo Pin ${probeRedPin} (Contacto directo de sondas)`
        );
        setLcdStatus('short');
        soundFX.playMultimeterBeep('short_alarm');
      });
      return;
    }

    const delayMs = Math.floor(390 + Math.random() * 420);
    const shortedPins = getShortedConnectedPins(probeRedPin, adjacentShorts);
    const isDirectShort = shortedPins.includes(probeBlackPin) && isCrimpedA;

    const wireRed = slotsA[probeRedPin - 1];
    const wireBlack = slotsA[probeBlackPin - 1];
    const isSameTwistedPair =
      wireRed && wireBlack && WIRES[wireRed].pairNumber === WIRES[wireBlack].pairNumber;

    runSimulatedMeasurement([probeRedPin, probeBlackPin], delayMs, () => {
      if (isDirectShort) {
        const val = (0.09 + Math.random() * 0.12).toFixed(2);
        setLcdMainValue(`${val} Ω`);
        setLcdSubLabel(
          `¡CORTOCIRCUITO DETECTADO entre Pin ${probeRedPin} y Pin ${probeBlackPin}!`
        );
        setLcdStatus('short');
        soundFX.playMultimeterBeep('short_alarm');
      } else if (isSameTwistedPair) {
        const pairNum = WIRES[wireRed!].pairNumber;
        const pairRes = computePairMeasurement(pairNum);
        setPairResults((prev) => ({ ...prev, [pairNum]: pairRes }));
        setLcdMainValue(pairRes.displayValue);
        setLcdSubLabel(
          `Pines ${probeRedPin}–${probeBlackPin} (${pairRes.pairName}): ${pairRes.verdict}`
        );
        setLcdStatus(
          pairRes.status === 'nominal'
            ? 'ok'
            : pairRes.status === 'open_cut' || pairRes.status === 'uncrimped'
            ? 'open'
            : 'short'
        );
        soundFX.playMultimeterBeep(pairRes.status === 'nominal' ? 'normal' : 'open');
      } else {
        setLcdMainValue('OL (>500 MΩ)');
        setLcdSubLabel(
          `Pines ${probeRedPin} y ${probeBlackPin} pertenecen a pares distintos (Aislamiento correcto)`
        );
        setLcdStatus('ok');
        soundFX.playMultimeterBeep('normal');
      }
    });
  };

  /**
   * Sequential scan of all 4 twisted pairs + all 7 adjacent pin pairs with realistic random delays
   */
  const handleRunFullMultimeterScan = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    if (intervalRef.current) window.clearInterval(intervalRef.current);

    setPairResults({});
    setAdjacentResults({});

    const totalDelay = Math.floor(550 + Math.random() * 450);
    runSimulatedMeasurement([1, 2], totalDelay, () => {
      const nextPairs: Record<number, PairMeasurementResult> = {};
      ([1, 2, 3, 4] as const).forEach((pNum) => {
        nextPairs[pNum] = computePairMeasurement(pNum);
      });

      const nextAdj: Record<number, AdjacentShortResult> = {};
      [1, 2, 3, 4, 5, 6, 7].forEach((pinL) => {
        nextAdj[pinL] = computeAdjacentMeasurement(pinL);
      });

      setPairResults(nextPairs);
      setAdjacentResults(nextAdj);
      onChangeProbePins(null);

      const shortedAdj = Object.values(nextAdj).filter((a) => a.isShorted);
      const openPairs = Object.values(nextPairs).filter(
        (p) => p.status === 'open_cut' || p.status === 'uncrimped'
      );

      if (shortedAdj.length > 0) {
        const firstShort = shortedAdj[0];
        setLcdMainValue(firstShort.displayValue);
        setLcdSubLabel(
          `¡ALERTA! ${shortedAdj.length} cortocircuito(s) entre hilos adyacentes detectado(s)`
        );
        setLcdStatus('short');
        soundFX.playMultimeterBeep('short_alarm');
      } else if (openPairs.length > 0) {
        setLcdMainValue('OL MΩ');
        setLcdSubLabel(
          `Escaneo completado: ${openPairs.length} par(es) en circuito abierto (hilo cortado o sin crimpar)`
        );
        setLcdStatus('open');
        soundFX.playMultimeterBeep('open');
      } else {
        const avgRes = (
          Object.values(nextPairs).reduce((acc, r) => acc + (r.resistanceOhms || 0), 0) / 4
        ).toFixed(2);
        setLcdMainValue(`${avgRes} Ω`);
        setLcdSubLabel(
          `4 pares balanceados (~${avgRes} Ω) y 0 cortocircuitos entre adyacentes`
        );
        setLcdStatus('ok');
        soundFX.playMultimeterBeep('normal');
      }
    });
  };

  // Compute TDR & High-Frequency Certification Parameters (NEXT dB, Insertion Loss dB)
  const cutDistanceMeters = (cableLengthMeters * cutDistanceRatio).toFixed(1);
  const cutRoundTripNs = Math.max(2, Math.round(Number(cutDistanceMeters) * 2 * 4.83));
  const insertionLossDb = Number(
    (
      cableLengthMeters *
      (cableCat === 'CAT5E' ? 0.21 : cableCat === 'CAT6' ? 0.18 : 0.15)
    ).toFixed(1)
  );
  const nextMarginDb = analysis.hasSplitPairError
    ? 6.4
    : adjacentShorts.length > 0
    ? 3.2
    : cableCat === 'CAT6A'
    ? 48.5
    : cableCat === 'CAT6'
    ? 44.2
    : 38.6;

  return (
    <div className="space-y-4">
      {/* Digital Multimeter LCD Enclosure */}
      <div className="bg-slate-900 dark:bg-slate-950 border-2 border-amber-500/80 rounded-xl p-4 text-slate-100 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-mono text-xs font-bold tracking-wider text-amber-400">
              MULTÍMETRO DIGITAL RJ-45 (TRUE RMS / Ω / TDR)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {(['CAT5E', 'CAT6', 'CAT6A'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCableCat(cat)}
                className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold transition-colors cursor-pointer ${
                  cableCat === cat
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'CAT5E' ? 'Cat 5e' : cat === 'CAT6' ? 'Cat 6' : 'Cat 6A'}
              </button>
            ))}
          </div>
        </div>

        {/* Backlit LCD Readout Screen */}
        <div
          className={`mt-3 rounded-lg border-2 p-3.5 font-mono transition-colors ${
            isMeasuring
              ? 'bg-amber-950/50 border-amber-500/60 text-amber-200'
              : lcdStatus === 'short'
              ? 'bg-red-950/70 border-red-500 text-red-200'
              : lcdStatus === 'open'
              ? 'bg-amber-950/40 border-amber-600/70 text-amber-200'
              : lcdStatus === 'ok'
              ? 'bg-emerald-950/50 border-emerald-500/70 text-emerald-200'
              : 'bg-slate-800/90 border-slate-700 text-slate-200'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] uppercase tracking-wider opacity-80">
            <span>
              OHMIOS (Ω) · {cableCat} · TRAMO: {cableLengthMeters}m
              {lastDelayMs ? ` · RETARDO: ${lastDelayMs}ms` : ''}
            </span>
            <span>
              {isMeasuring
                ? 'ESTABILIZANDO SONDA...'
                : lcdStatus === 'short'
                ? '🔊 ¡CORTOCIRCUITO!'
                : lcdStatus === 'open'
                ? 'CIRCUITO ABIERTO (OL)'
                : lcdStatus === 'ok'
                ? 'LECTURA ESTABLE'
                : 'EN ESPERA'}
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-4">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums">
              {isMeasuring ? transientReading : lcdMainValue}
            </div>
            <div className="text-xs font-mono text-right">
              <span className="inline-block px-2 py-0.5 rounded bg-red-600/90 text-white font-bold mr-1">
                V/Ω: Pin {probeRedPin}
              </span>
              <span className="inline-block px-2 py-0.5 rounded bg-slate-700 text-slate-200 font-bold">
                COM: Pin {probeBlackPin}
              </span>
            </div>
          </div>

          <div className="mt-2 text-xs font-sans leading-snug opacity-95">
            {isMeasuring
              ? 'Inyectando corriente de prueba DC y estabilizando lectura óhmica del par...'
              : lcdSubLabel}
          </div>
        </div>

        {/* Cable Length Slider & Full Scan Action */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span>Longitud del tramo UTP ({cableCat}):</span>
              <span className="font-mono font-bold text-amber-400">{cableLengthMeters} metros</span>
            </div>
            <input
              type="range"
              min={2}
              max={90}
              step={1}
              value={cableLengthMeters}
              onChange={(e) => setCableLengthMeters(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>

          <button
            type="button"
            disabled={isMeasuring}
            onClick={handleRunFullMultimeterScan}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Medir Todo (4 Pares + Cortos)</span>
          </button>
        </div>

        {/* TDR (Time Domain Reflectometer) & High-Frequency Telemetry Strip */}
        <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
          <div className="bg-slate-800/80 rounded-lg p-2 border border-slate-700/80">
            <div className="text-slate-400 flex items-center gap-1">
              <Radio className="w-3 h-3 text-sky-400 shrink-0" />
              <span>REFLECTÓMETRO TDR</span>
            </div>
            <div className="mt-1 font-bold text-slate-100">
              {adjacentShorts.length > 0
                ? `Corto a 0.1 m (P${adjacentShorts[0]}–P${adjacentShorts[0] + 1})`
                : analysis.cutWires.length > 0
                ? `Corte a ${cutDistanceMeters} m (${cutRoundTripNs} ns)`
                : `Fin de cable a ${cableLengthMeters}.0 m`}
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-lg p-2 border border-slate-700/80">
            <div className="text-slate-400">DIAFONÍA (NEXT)</div>
            <div
              className={`mt-1 font-bold ${
                nextMarginDb < 20 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {nextMarginDb.toFixed(1)} dB · {nextMarginDb < 20 ? 'FALLO NEXT' : 'ÓPTIMO'}
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-lg p-2 border border-slate-700/80">
            <div className="text-slate-400">ATENUACIÓN IL</div>
            <div className="mt-1 font-bold text-sky-300">
              {insertionLossDb} dB ({cableLengthMeters}m)
            </div>
          </div>
        </div>

        {/* If a wire is cut, let user move where the cut is along the cable to see TDR change */}
        {analysis.cutWires.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-300">
              Posición física del corte (TDR):{' '}
              <strong className="font-mono text-amber-400">{cutDistanceMeters} m</strong> del
              Conector A
            </span>
            <input
              type="range"
              min={0.05}
              max={0.95}
              step={0.05}
              value={cutDistanceRatio}
              onChange={(e) => setCutDistanceRatio(Number(e.target.value))}
              className="w-28 accent-amber-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              title="Desplazar punto de rotura del hilo a lo largo del cable para probar el TDR"
            />
          </div>
        )}
      </div>

      {/* 1. Loop Resistance per Twisted Pair (4 Pairs) */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              1. Resistencia de Bucle por Par Trenzado (Con Tapón Loopback en Extremo B)
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Haz clic en cualquier par para medir su resistencia óhmica con retardo aleatorio de
              estabilización
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {TWISTED_PAIRS_SPEC.map((pair) => {
            const res = pairResults[pair.pairNumber];
            const pinPosA = slotsA.indexOf(pair.positiveWire) + 1 || null;
            const pinNegA = slotsA.indexOf(pair.negativeWire) + 1 || null;

            return (
              <button
                key={pair.pairNumber}
                type="button"
                disabled={isMeasuring}
                onClick={() => handleMeasureSinglePair(pair.pairNumber)}
                className={`flex flex-col justify-between p-3 rounded-lg border text-left transition-all cursor-pointer disabled:opacity-60 ${
                  res?.status === 'nominal'
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                    : res?.status === 'short_near' || res?.status === 'short_cross'
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800'
                    : res?.status === 'open_cut' || res?.status === 'uncrimped'
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                    : 'bg-white hover:bg-slate-100/80 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="w-full flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <WireVisual wireId={pair.positiveWire} className="w-4 h-3 rounded-xs" />
                    <WireVisual wireId={pair.negativeWire} className="w-4 h-3 rounded-xs" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {pair.name}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {pinPosA && pinNegA ? `Pines ${pinPosA}–${pinNegA}` : 'Sin pines'}
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200/70 dark:border-slate-800 w-full flex items-baseline justify-between gap-2">
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                    {res ? res.verdict : 'Pulsar para medir Ω del par'}
                  </span>
                  <span
                    className={`font-mono text-xs font-bold whitespace-nowrap shrink-0 ${
                      !res
                        ? 'text-sky-600 dark:text-sky-400'
                        : res.status === 'nominal'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : res.status === 'short_near' || res.status === 'short_cross'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {res ? res.displayValue : 'Medir Ω →'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Adjacent Wires Short-Circuit Detector (Pins 1-2, 2-3, ..., 7-8) */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              2. Detector de Cortocircuitos entre Hilos Adyacentes (Pines Contiguos 1–2 a 7–8)
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Mide el aislamiento entre pines vecinos o simula/repara un puente eléctrico (⚡)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((pinL) => {
            const pinR = pinL + 1;
            const isShortActive = adjacentShorts.includes(pinL);
            const adjRes = adjacentResults[pinL];

            return (
              <div
                key={pinL}
                className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border text-xs transition-colors ${
                  isShortActive
                    ? 'bg-red-50/90 dark:bg-red-950/40 border-red-300 dark:border-red-800'
                    : adjRes && !adjRes.isShorted
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  disabled={isMeasuring}
                  onClick={() => handleMeasureAdjacentPinPair(pinL)}
                  className="flex-1 flex items-center justify-between pr-2 text-left cursor-pointer disabled:opacity-50"
                  title={`Colocar puntas del multímetro en Pin ${pinL} y Pin ${pinR}`}
                >
                  <div>
                    <div className="font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      <span>
                        Pines {pinL}–{pinR}
                      </span>
                      {isShortActive ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                      ) : (
                        adjRes && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {adjRes
                        ? adjRes.isShorted
                          ? '¡Cortocircuito detectado!'
                          : 'Aislado (>500 MΩ)'
                        : 'Clic para medir aislamiento'}
                    </div>
                  </div>

                  <span
                    className={`font-mono text-xs font-bold ${
                      adjRes
                        ? adjRes.isShorted
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-emerald-700 dark:text-emerald-400'
                        : 'text-sky-600 dark:text-sky-400'
                    }`}
                  >
                    {adjRes ? adjRes.displayValue : 'Medir'}
                  </span>
                </button>

                {/* Quick button to inject or repair short circuit on this adjacent pair */}
                <button
                  type="button"
                  onClick={() => onToggleAdjacentShort(pinL)}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isShortActive
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                      : 'bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-amber-950/60 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                  title={
                    isShortActive
                      ? `Reparar cortocircuito entre Pin ${pinL} y Pin ${pinR}`
                      : `Simular cortocircuito entre Pin ${pinL} y Pin ${pinR}`
                  }
                >
                  {isShortActive ? (
                    <span className="inline-flex items-center gap-0.5">
                      <Wrench className="w-3 h-3" /> Aislar
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5">
                      <Zap className="w-3 h-3 text-amber-500" /> Corto
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Custom Probe Placement (Sonda Roja V/Ω & Sonda Negra COM) */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
          3. Puntas de Prueba Manuales (Sonda Roja V/Ω + Sonda Negra COM)
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <label className="font-semibold text-red-600 dark:text-red-400">Sonda Roja:</label>
            <select
              value={probeRedPin}
              onChange={(e) => setProbeRedPin(Number(e.target.value))}
              className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                <option key={p} value={p}>
                  Pin {p}
                </option>
              ))}
            </select>

            <label className="font-semibold text-slate-700 dark:text-slate-300 ml-2">
              Sonda Negra:
            </label>
            <select
              value={probeBlackPin}
              onChange={(e) => setProbeBlackPin(Number(e.target.value))}
              className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                <option key={p} value={p}>
                  Pin {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isMeasuring}
              onClick={handleMeasureCustomProbes}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Medir Pines {probeRedPin} y {probeBlackPin}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onChangeProbePins(null);
                setLcdMainValue('LISTO');
                setLcdStatus('idle');
                setLcdSubLabel('Sondas retiradas del conector RJ-45');
              }}
              className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Retirar puntas de prueba"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
