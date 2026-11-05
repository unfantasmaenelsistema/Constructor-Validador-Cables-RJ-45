import React from 'react';
import { ALL_WIRE_IDS, WIRES, WireFault, WireId } from '../data/cableStandards';
import { WireVisual } from './WireSwatch';
import { Scissors, ShieldCheck, Wrench, Zap } from 'lucide-react';

interface CableRoutingVisualizerProps {
  slotsA: (WireId | null)[];
  slotsB: (WireId | null)[];
  wireFaults: Record<WireId, WireFault>;
  adjacentShorts: number[]; // 1..7 meaning short between pin k and k+1
  activePulseMasterPin: number | null; // 1..8
  activeMultimeterPins?: [number, number] | null; // [pinRed, pinBlack] when multimeter probes are active
  onToggleWireFault: (wireId: WireId) => void;
  onToggleAdjacentShort: (pinLeft: number) => void;
  onRepairAllWires: () => void;
  /** Durante un reto hay que localizar y reparar cada avería. */
  repairAllLocked?: boolean;
}

export const CableRoutingVisualizer: React.FC<CableRoutingVisualizerProps> = ({
  slotsA,
  slotsB,
  wireFaults,
  adjacentShorts,
  activePulseMasterPin,
  activeMultimeterPins = null,
  onToggleWireFault,
  onToggleAdjacentShort,
  onRepairAllWires,
  repairAllLocked = false,
}) => {
  const cutCount = ALL_WIRE_IDS.filter((id) => wireFaults[id] === 'cut').length;
  const totalFaults = cutCount + adjacentShorts.length;

  // Compute SVG paths between Conector A pins (1..8) and Conector B pins (1..8)
  const pinX = (pinIdx: number) => 45 + pinIdx * 72; // 8 pins across 590px viewBox

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Tramo Físico del Cable UTP (4 Pares Trenzados)</span>
            <span aria-hidden="true">·</span>
            <span>Simulador de Continuidad, Roturas y Cortocircuitos</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            Mapa de Trazado Interno (Extremo A ↔ Extremo B)
          </h3>
        </div>

        {totalFaults > 0 && repairAllLocked && (
          <span className="text-[11px] text-amber-700 dark:text-amber-300">
            Reto en curso: localiza cada avería con el multímetro y repárala hilo a hilo.
          </span>
        )}
        {totalFaults > 0 && !repairAllLocked && (
          <button
            type="button"
            onClick={onRepairAllWires}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>
              Sanear todas las averías ({cutCount} corte{cutCount !== 1 ? 's' : ''},{' '}
              {adjacentShorts.length} corto{adjacentShorts.length !== 1 ? 's' : ''})
            </span>
          </button>
        )}
      </div>

      {/* Interactive SVG Wire Routing Diagram */}
      <div className="mt-4 w-full overflow-x-auto">
        <svg
          viewBox="0 0 600 165"
          className="w-full min-w-[480px] h-40 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
          aria-label="Esquema de conexión pin a pin entre Extremo A y Extremo B"
        >
          {/* Top and Bottom Connector Labels */}
          {Array.from({ length: 8 }).map((_, idx) => {
            const pinNum = idx + 1;
            const x = pinX(idx);
            const isMasterPulsed = activePulseMasterPin === pinNum;
            const isRedProbe = activeMultimeterPins?.[0] === pinNum;
            const isBlackProbe = activeMultimeterPins?.[1] === pinNum;

            return (
              <g key={idx}>
                {/* Pin A Node */}
                <circle
                  cx={x}
                  cy={24}
                  r={11}
                  className={
                    isRedProbe
                      ? 'fill-red-500 stroke-red-700'
                      : isBlackProbe
                      ? 'fill-slate-800 stroke-slate-950 dark:fill-slate-600 dark:stroke-slate-300'
                      : isMasterPulsed
                      ? 'fill-amber-400 stroke-amber-600'
                      : 'fill-slate-200 dark:fill-slate-800 stroke-slate-400 dark:stroke-slate-600'
                  }
                  strokeWidth="1.5"
                />
                <text
                  x={x}
                  y={28}
                  textAnchor="middle"
                  className={`text-[10px] font-mono font-bold ${
                    isRedProbe || isBlackProbe
                      ? 'fill-white'
                      : 'fill-slate-900 dark:fill-slate-100'
                  }`}
                >
                  A{pinNum}
                </text>

                {/* Pin B Node */}
                <circle
                  cx={x}
                  cy={141}
                  r={11}
                  className="fill-slate-200 dark:fill-slate-800 stroke-slate-400 dark:stroke-slate-600"
                  strokeWidth="1.5"
                />
                <text
                  x={x}
                  y={145}
                  textAnchor="middle"
                  className="text-[10px] font-mono font-bold fill-slate-900 dark:fill-slate-100"
                >
                  B{pinNum}
                </text>
              </g>
            );
          })}

          {/* Draw paths for each wire present in both A and B */}
          {slotsA.map((wireId, idxA) => {
            if (!wireId) return null;
            const idxB = slotsB.indexOf(wireId);
            if (idxB === -1) return null;

            const pinNumA = idxA + 1;
            const x1 = pinX(idxA);
            const y1 = 35;
            const x2 = pinX(idxB);
            const y2 = 130;
            const wire = WIRES[wireId];
            const isCut = wireFaults[wireId] === 'cut';
            const isActivePulse =
              activePulseMasterPin === pinNumA ||
              activeMultimeterPins?.[0] === pinNumA ||
              activeMultimeterPins?.[1] === pinNumA;

            const pathD = `M ${x1} ${y1} C ${x1} 82, ${x2} 82, ${x2} ${y2}`;
            const midX = (x1 + x2) / 2;
            const midY = 82.5;

            return (
              <g key={wireId}>
                {/* Base stroke */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={wire.baseColor}
                  strokeWidth={isActivePulse ? 6 : 4}
                  strokeLinecap="round"
                  strokeDasharray={isCut ? '6 6' : undefined}
                  opacity={isCut ? 0.45 : 0.95}
                />
                {/* White stripe overlay if striped wire */}
                {wire.isStriped && !isCut && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth={2.2}
                    strokeDasharray="5 6"
                    strokeLinecap="round"
                  />
                )}
                {/* Active pulse highlight */}
                {isActivePulse && !isCut && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#FACC15"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                )}
                {/* Cut indicator X */}
                {isCut && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <circle r="9" fill="#DC2626" />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      className="text-[10px] font-bold font-mono"
                    >
                      ✕
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Draw electrical short bridges between adjacent pins on Connector A */}
          {adjacentShorts.map((pinLeft) => {
            const xLeft = pinX(pinLeft - 1);
            const xRight = pinX(pinLeft);
            const midX = (xLeft + xRight) / 2;
            const bridgeY = 52;

            return (
              <g key={`short-${pinLeft}`}>
                <line
                  x1={xLeft}
                  y1={bridgeY}
                  x2={xRight}
                  y2={bridgeY}
                  stroke="#EF4444"
                  strokeWidth="4"
                />
                <circle
                  cx={midX}
                  cy={bridgeY}
                  r="10"
                  fill="#F59E0B"
                  stroke="#B45309"
                  strokeWidth="1.5"
                />
                <text
                  x={midX}
                  y={bridgeY + 3.5}
                  textAnchor="middle"
                  fill="#1E293B"
                  className="text-[10px] font-mono font-bold"
                >
                  ⚡
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Interactive Wire Integrity Strip (Cut / Repair Individual Wires) */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
          <span className="font-medium">
            1. Simulador de Hilos Cortados (Circuito Abierto OL): haz clic en un hilo para cortarlo
            (✂️) o repararlo
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {ALL_WIRE_IDS.map((wireId) => {
            const wire = WIRES[wireId];
            const isCut = wireFaults[wireId] === 'cut';
            return (
              <button
                key={wireId}
                type="button"
                onClick={() => onToggleWireFault(wireId)}
                className={`flex flex-col items-start justify-between p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  isCut
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
                title={
                  isCut
                    ? `Reparar hilo ${wire.name}`
                    : `Cortar hilo ${wire.name} para simular avería de continuidad`
                }
              >
                <div className="w-full flex items-center justify-between gap-1 mb-1.5">
                  <WireVisual wireId={wireId} className="w-7 h-2.5 rounded-xs shrink-0" />
                  {isCut ? (
                    <Scissors className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                </div>
                <span className="text-[11px] font-semibold leading-tight truncate w-full">
                  {wire.shortName}
                </span>
                <span
                  className={`text-[10px] font-mono mt-0.5 ${
                    isCut
                      ? 'text-red-600 dark:text-red-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isCut ? 'CORTADO' : 'CONTINUO'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Adjacent Short Circuit Injector */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
          <span className="font-medium">
            2. Simulador de Cortocircuitos entre Pines Adyacentes (⚡): haz clic para puentear o
            aislar dos pines contiguos y medirlos con el Multímetro
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((pinLeft) => {
            const isShorted = adjacentShorts.includes(pinLeft);
            return (
              <button
                key={pinLeft}
                type="button"
                onClick={() => onToggleAdjacentShort(pinLeft)}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                  isShorted
                    ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-400 dark:border-amber-700 text-amber-950 dark:text-amber-200 font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
                title={
                  isShorted
                    ? `Eliminar cortocircuito entre Pin ${pinLeft} y Pin ${pinLeft + 1}`
                    : `Provocar cortocircuito entre Pin ${pinLeft} y Pin ${pinLeft + 1}`
                }
              >
                <span>
                  P{pinLeft}–P{pinLeft + 1}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[10px]">
                  <Zap
                    className={`w-3.5 h-3.5 ${
                      isShorted
                        ? 'text-amber-600 dark:text-amber-400 fill-amber-500'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  {isShorted ? 'CORTO' : 'AISLADO'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
