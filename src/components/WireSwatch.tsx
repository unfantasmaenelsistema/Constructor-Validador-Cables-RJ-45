import React from 'react';
import { WIRES, WireId } from '../data/cableStandards';

interface WireVisualProps {
  wireId: WireId;
  className?: string;
  vertical?: boolean;
  showCopperTip?: boolean;
}

export const WireVisual: React.FC<WireVisualProps> = ({
  wireId,
  className = '',
  vertical = false,
  showCopperTip = false,
}) => {
  const wire = WIRES[wireId];

  const backgroundStyle: React.CSSProperties = wire.isStriped
    ? {
        backgroundImage: `repeating-linear-gradient(
          ${vertical ? '135deg' : '45deg'},
          #FFFFFF 0px,
          #FFFFFF 6px,
          ${wire.baseColor} 6px,
          ${wire.baseColor} 12px
        )`,
        borderColor: wire.borderColor,
      }
    : {
        backgroundColor: wire.baseColor,
        borderColor: wire.borderColor,
      };

  return (
    <div
      className={`relative overflow-hidden border transition-transform ${className}`}
      style={backgroundStyle}
      title={`${wire.name} (${wire.pairName})`}
    >
      {/* Subtle cylindrical highlight for realistic PVC wire insulation */}
      <div
        className={`pointer-events-none absolute inset-0 ${
          vertical
            ? 'bg-gradient-to-r from-white/25 via-transparent to-black/25'
            : 'bg-gradient-to-b from-white/25 via-transparent to-black/25'
        }`}
      />
      {showCopperTip && (
        <div
          className={
            vertical
              ? 'absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600 border-b border-amber-700/60'
              : 'absolute right-0 inset-y-0 w-2 bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-600 border-l border-amber-700/60'
          }
        />
      )}
    </div>
  );
};
