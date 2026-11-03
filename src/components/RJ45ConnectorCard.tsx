import React, { useState } from 'react';
import {
  ALL_WIRE_IDS,
  ConnectorStandard,
  STANDARD_GIGABIT_CROSS_B,
  STANDARD_ROLLOVER_B,
  STANDARD_T568A,
  STANDARD_T568B,
  WIRES,
  WireFault,
  WireId,
} from '../data/cableStandards';
import { WireVisual } from './WireSwatch';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  RotateCcw,
  Scissors,
  Shuffle,
  Unlock,
  Wrench,
} from 'lucide-react';

interface RJ45ConnectorCardProps {
  side: 'A' | 'B';
  title: string;
  subtitle: string;
  slots: (WireId | null)[];
  standard: ConnectorStandard;
  standardLabel: string;
  isCrimped: boolean;
  activePulsePin: number | null; // 1..8 when tester is pulsing this pin
  wireFaults: Record<WireId, WireFault>;
  onUpdateSlots: (newSlots: (WireId | null)[]) => void;
  onToggleCrimp: () => void;
}

export const RJ45ConnectorCard: React.FC<RJ45ConnectorCardProps> = ({
  side,
  title,
  subtitle,
  slots,
  standard,
  standardLabel,
  isCrimped,
  activePulsePin,
  wireFaults,
  onUpdateSlots,
  onToggleCrimp,
}) => {
  const [selectedWire, setSelectedWire] = useState<WireId | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [guideOverlay, setGuideOverlay] = useState<'NONE' | '568B' | '568A'>('NONE');

  // Wires not yet placed in this connector
  const unplacedWires = ALL_WIRE_IDS.filter((id) => !slots.includes(id));
  const placedCount = slots.filter((s) => s !== null).length;

  const placeOrSwapWire = (targetSlotIndex: number, wireId: WireId) => {
    if (isCrimped) return;
    const next = [...slots];
    const existingIndex = next.indexOf(wireId);
    const wireCurrentlyAtTarget = next[targetSlotIndex];

    if (existingIndex !== -1) {
      // Swap between the two slots
      next[existingIndex] = wireCurrentlyAtTarget;
      next[targetSlotIndex] = wireId;
    } else {
      // Coming from unplaced tray
      next[targetSlotIndex] = wireId;
    }
    onUpdateSlots(next);
    setSelectedWire(null);
    setSelectedSlotIndex(null);
  };

  const handleSlotClick = (slotIdx: number) => {
    if (isCrimped) return;

    // If user already selected an unplaced wire, place it here
    if (selectedWire) {
      placeOrSwapWire(slotIdx, selectedWire);
      return;
    }

    // If user already selected another slot, swap them
    if (selectedSlotIndex !== null) {
      if (selectedSlotIndex === slotIdx) {
        setSelectedSlotIndex(null);
        return;
      }
      const next = [...slots];
      const temp = next[selectedSlotIndex];
      next[selectedSlotIndex] = next[slotIdx];
      next[slotIdx] = temp;
      onUpdateSlots(next);
      setSelectedSlotIndex(null);
      return;
    }

    // Otherwise, if slot has a wire, select this slot for swapping or removing
    if (slots[slotIdx] !== null) {
      setSelectedSlotIndex(slotIdx);
    }
  };

  const handleRemoveFromSlot = (slotIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCrimped) return;
    const next = [...slots];
    next[slotIdx] = null;
    onUpdateSlots(next);
    if (selectedSlotIndex === slotIdx) setSelectedSlotIndex(null);
  };

  const handleDragStartWire = (e: React.DragEvent, wireId: WireId) => {
    if (isCrimped) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', wireId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnSlot = (e: React.DragEvent, targetSlotIdx: number) => {
    e.preventDefault();
    setDragOverSlot(null);
    if (isCrimped) return;
    const wireId = e.dataTransfer.getData('text/plain') as WireId;
    if (wireId && WIRES[wireId]) {
      placeOrSwapWire(targetSlotIdx, wireId);
    }
  };

  const handleShuffle = () => {
    if (isCrimped) return;
    const shuffled = [...ALL_WIRE_IDS].sort(() => Math.random() - 0.5);
    onUpdateSlots(shuffled);
    setSelectedWire(null);
    setSelectedSlotIndex(null);
  };

  const handleClear = () => {
    if (isCrimped) return;
    onUpdateSlots(Array(8).fill(null));
    setSelectedWire(null);
    setSelectedSlotIndex(null);
  };

  const guideReference =
    guideOverlay === '568A'
      ? STANDARD_T568A
      : guideOverlay === '568B'
      ? STANDARD_T568B
      : null;

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
      {/* Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
              EXTREMO {side}
            </span>
            <span aria-hidden="true">·</span>
            <span>{subtitle}</span>
            <span aria-hidden="true">·</span>
            <span
              className={`font-medium ${
                standard === 'T568A' || standard === 'T568B'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {standardLabel}
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            {title}
          </h3>
        </div>

        {/* Crimp Action Button */}
        <button
          type="button"
          onClick={onToggleCrimp}
          disabled={placedCount < 8 && !isCrimped}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
            isCrimped
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              : placedCount === 8
              ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
          title={
            isCrimped
              ? 'Desbloquear cabezal para editar los hilos'
              : placedCount < 8
              ? 'Coloca los 8 hilos antes de crimpar'
              : 'Crimpar conector RJ-45 para fijar los pines dorados'
          }
        >
          {isCrimped ? (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>Crimpado (Editar)</span>
            </>
          ) : (
            <>
              <Wrench className="w-3.5 h-3.5" />
              <span>Crimpar RJ-45</span>
            </>
          )}
        </button>
      </div>

      {/* Preset Quick Actions Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-3 border-b border-slate-100 dark:border-slate-800/70">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={isCrimped}
            onClick={() => onUpdateSlots([...STANDARD_T568B])}
            className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Cargar T568B
          </button>
          <button
            type="button"
            disabled={isCrimped}
            onClick={() => onUpdateSlots([...STANDARD_T568A])}
            className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Cargar T568A
          </button>
          {side === 'B' && (
            <>
              <button
                type="button"
                disabled={isCrimped}
                onClick={() => onUpdateSlots([...STANDARD_GIGABIT_CROSS_B])}
                className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Cruza los 4 pares respecto a T568B (Gigabit Crossover)"
              >
                Cruzado 4-Pares
              </button>
              <button
                type="button"
                disabled={isCrimped}
                onClick={() => onUpdateSlots([...STANDARD_ROLLOVER_B])}
                className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Orden inverso 8 a 1 respecto a T568B (Cable Consola)"
              >
                Consola (8→1)
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              setGuideOverlay((prev) =>
                prev === 'NONE' ? '568B' : prev === '568B' ? '568A' : 'NONE'
              )
            }
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              guideOverlay !== 'NONE'
                ? 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}
            title="Mostrar u ocultar chuleta de colores en cada pin"
          >
            {guideOverlay === 'NONE' ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Chuleta</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Guía {guideOverlay}</span>
              </>
            )}
          </button>
          <button
            type="button"
            disabled={isCrimped}
            onClick={handleShuffle}
            className="p-1.5 text-xs rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-40 transition-colors cursor-pointer"
            title="Desordenar hilos al azar"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={isCrimped}
            onClick={handleClear}
            className="p-1.5 text-xs rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-40 transition-colors cursor-pointer"
            title="Extraer todos los hilos del conector"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Realistic RJ-45 Transparent Head Housing (8P8C) */}
      <div className="mt-4 flex flex-col items-center">
        {/* Orientation Caption */}
        <div className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 px-1">
          <span>Vista frontal: Contactos hacia arriba · Pestaña hacia abajo</span>
          <span className="font-mono">Pin 1 → Pin 8</span>
        </div>

        {/* Polycarbonate Plug Container */}
        <div
          className={`relative w-full rounded-xl border-2 p-3 transition-colors ${
            isCrimped
              ? 'bg-slate-100/90 dark:bg-slate-800/60 border-emerald-500/60 dark:border-emerald-500/50'
              : 'bg-slate-50/80 dark:bg-slate-950/60 border-slate-300 dark:border-slate-700'
          }`}
        >
          {/* Top Molded Bevel of RJ-45 Plug */}
          <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
            {slots.map((wireId, idx) => {
              const pinNumber = idx + 1;
              const isSelectedSlot = selectedSlotIndex === idx;
              const isDragTarget = dragOverSlot === idx;
              const isPulsing = activePulsePin === pinNumber;
              const expectedWire = guideReference ? guideReference[idx] : null;
              const isMatchesGuide = expectedWire && wireId === expectedWire;
              const isWireCut = wireId ? wireFaults[wireId] === 'cut' : false;

              return (
                <div
                  key={pinNumber}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!isCrimped) setDragOverSlot(idx);
                  }}
                  onDragLeave={() => setDragOverSlot(null)}
                  onDrop={(e) => handleDropOnSlot(e, idx)}
                  onClick={() => handleSlotClick(idx)}
                  className={`group relative flex flex-col items-center rounded-lg border p-1.5 transition-all select-none ${
                    isCrimped ? 'cursor-default' : 'cursor-pointer'
                  } ${
                    isPulsing
                      ? 'ring-2 ring-amber-400 bg-amber-50/90 dark:bg-amber-950/50 border-amber-500'
                      : isSelectedSlot
                      ? 'ring-2 ring-sky-500 bg-sky-50 dark:bg-sky-950/50 border-sky-500'
                      : isDragTarget
                      ? 'ring-2 ring-sky-400 bg-sky-50/60 dark:bg-sky-900/30 border-sky-400'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                >
                  {/* Pin Number Header */}
                  <span
                    className={`font-mono text-xs font-bold leading-none mb-1.5 ${
                      isPulsing
                        ? 'text-amber-600 dark:text-amber-300'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {pinNumber}
                  </span>

                  {/* Gold 8P8C Contact Blade */}
                  <div
                    className={`w-3.5 sm:w-4 rounded-xs border transition-all ${
                      isCrimped
                        ? 'h-5 bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-600 border-amber-600 shadow-xs translate-y-0.5'
                        : 'h-4 bg-gradient-to-b from-yellow-200/80 via-amber-300/80 to-yellow-500/80 border-amber-500/60'
                    }`}
                    title={
                      isCrimped
                        ? `Pin ${pinNumber}: Cuchilla dorada perforando el aislante`
                        : `Pin ${pinNumber}: Cuchilla dorada sin crimpar`
                    }
                  />

                  {/* Wire Channel Slot */}
                  <div className="relative w-full h-24 sm:h-28 mt-1 rounded-md bg-slate-100 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-end overflow-hidden">
                    {wireId ? (
                      <div
                        draggable={!isCrimped}
                        onDragStart={(e) => handleDragStartWire(e, wireId)}
                        className="w-full h-full flex flex-col items-center justify-between p-0.5"
                      >
                        <WireVisual
                          wireId={wireId}
                          vertical={true}
                          showCopperTip={true}
                          className="w-4 sm:w-5 h-full rounded-xs shadow-2xs"
                        />
                        {!isCrimped && (
                          <button
                            type="button"
                            onClick={(e) => handleRemoveFromSlot(idx, e)}
                            className="absolute top-1 right-0.5 opacity-0 group-hover:opacity-100 focus:opacity-100 bg-slate-900/80 text-white rounded-xs px-1 text-[10px] leading-tight transition-opacity"
                            title="Retirar hilo"
                          >
                            ×
                          </button>
                        )}
                        {isWireCut && (
                          <div
                            className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-red-600 text-white text-[10px] font-bold py-0.5 flex items-center justify-center shadow-xs"
                            title="Este hilo está cortado en el tramo del cable"
                          >
                            <Scissors className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full px-0.5 text-center">
                        <span className="text-[10px] text-slate-400 dark:text-slate-600 font-mono">
                          Vacío
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Wire Short Label */}
                  <div className="mt-1.5 h-4 flex items-center justify-center w-full">
                    {wireId ? (
                      <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-full">
                        {WIRES[wireId].shortName}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 dark:text-slate-600">—</span>
                    )}
                  </div>

                  {/* Optional Guide Hint */}
                  {expectedWire && (
                    <div
                      className={`mt-1 w-full py-0.5 px-1 rounded-xs text-[9px] font-mono text-center truncate ${
                        isMatchesGuide
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : 'bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                      title={`Guía ${guideOverlay}: Pin ${pinNumber} lleva ${WIRES[expectedWire].name}`}
                    >
                      {WIRES[expectedWire].shortName}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Crimp Strain-Relief Bar (Prensaestopas del conector RJ-45) */}
          <div
            className={`mt-3 h-4 w-4/5 mx-auto rounded-sm border flex items-center justify-center text-[10px] font-mono tracking-wider transition-all ${
              isCrimped
                ? 'bg-emerald-600/20 border-emerald-500/60 text-emerald-800 dark:text-emerald-300 font-semibold'
                : 'bg-slate-200/70 dark:bg-slate-800/70 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            {isCrimped ? (
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> PRENSAESTOPAS CRIMPADO Y FIJADO
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Unlock className="w-3 h-3" /> PRENSAESTOPAS ABIERTO (SIN CRIMPAR)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Unplaced Wires Tray / Drag & Click Instructions */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        {isCrimped ? (
          <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
            <span>
              Conector crimpado correctamente. Para cambiar algún hilo, pulsa «Crimpado (Editar)».
            </span>
          </div>
        ) : unplacedWires.length > 0 ? (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
              <span className="font-medium">
                Hilos pendientes de insertar ({unplacedWires.length}): arrastra a un pin o haz clic
                en un hilo y luego en su pin
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {unplacedWires.map((wireId) => {
                const wire = WIRES[wireId];
                const isSelected = selectedWire === wireId;
                return (
                  <button
                    key={wireId}
                    type="button"
                    draggable
                    onDragStart={(e) => handleDragStartWire(e, wireId)}
                    onClick={() => {
                      setSelectedSlotIndex(null);
                      setSelectedWire(isSelected ? null : wireId);
                    }}
                    className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-grab active:cursor-grabbing ${
                      isSelected
                        ? 'ring-2 ring-sky-500 border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-100'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <WireVisual wireId={wireId} className="w-6 h-3 rounded-xs shrink-0" />
                    <span className="whitespace-nowrap">{wire.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              {selectedSlotIndex !== null
                ? `Pin ${selectedSlotIndex + 1} seleccionado: haz clic en otro pin para intercambiar sus hilos.`
                : 'Los 8 hilos están insertados. Puedes arrastrar o hacer clic entre dos pines para intercambiar su posición.'}
            </span>
            {!isCrimped && (
              <span className="font-medium text-sky-600 dark:text-sky-400">
                ¡No olvides pulsar «Crimpar RJ-45»!
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
