import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Zap, Wind, DollarSign, Footprints } from 'lucide-react';

interface MobileControlsProps {
  onMoveVectorChange: (vector: { x: number; y: number }) => void;
  onInteract: () => void;
  onToggleSprint: (sprinting: boolean) => void;
  onEvade: () => void;
  onBoost: () => void;
  canInteract: boolean;
  isSprinting: boolean;
  boostActive: boolean;
  boostCooldown: number;
  evadeCooldown: number;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMoveVectorChange,
  onInteract,
  onToggleSprint,
  onEvade,
  onBoost,
  canInteract,
  isSprinting,
  boostActive,
  boostCooldown,
  evadeCooldown,
}) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [touchId, setTouchId] = useState<number | null>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isHeldSprint, setIsHeldSprint] = useState(false);

  const radius = 45; // Max joystick radius in px

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      if (touchId !== null) return;
      const touch = e.changedTouches[0];
      setTouchId(touch.identifier);

      if (joystickBaseRef.current) {
        const rect = joystickBaseRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = touch.clientX - centerX;
        const dy = touch.clientY - centerY;
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, radius);
        const angle = Math.atan2(dy, dx);

        const kx = Math.cos(angle) * clampedDist;
        const ky = Math.sin(angle) * clampedDist;

        setKnobPos({ x: kx, y: ky });
        onMoveVectorChange({
          x: clampedDist === 0 ? 0 : kx / radius,
          y: clampedDist === 0 ? 0 : ky / radius,
        });
      }
    },
    [touchId, onMoveVectorChange]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      if (touchId === null || !joystickBaseRef.current) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId) {
          const rect = joystickBaseRef.current.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const dx = touch.clientX - centerX;
          const dy = touch.clientY - centerY;
          const dist = Math.hypot(dx, dy);
          const clampedDist = Math.min(dist, radius);
          const angle = Math.atan2(dy, dx);

          const kx = Math.cos(angle) * clampedDist;
          const ky = Math.sin(angle) * clampedDist;

          setKnobPos({ x: kx, y: ky });
          onMoveVectorChange({
            x: clampedDist === 0 ? 0 : kx / radius,
            y: clampedDist === 0 ? 0 : ky / radius,
          });
          break;
        }
      }
    },
    [touchId, onMoveVectorChange]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      if (touchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          setTouchId(null);
          setKnobPos({ x: 0, y: 0 });
          onMoveVectorChange({ x: 0, y: 0 });
          break;
        }
      }
    },
    [touchId, onMoveVectorChange]
  );

  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none z-20 flex items-end justify-between p-4 pb-6 select-none touch-none">
      {/* Virtual Joystick Container (Bottom-Left) */}
      <div
        ref={joystickBaseRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="pointer-events-auto relative w-32 h-32 rounded-full bg-stone-900/70 border-2 border-stone-700/80 backdrop-blur-md flex items-center justify-center shadow-2xl active:border-amber-500/50"
      >
        {/* Directional ticks */}
        <div className="absolute top-2 w-1.5 h-1.5 rounded-full bg-stone-500/50" />
        <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-stone-500/50" />
        <div className="absolute left-2 w-1.5 h-1.5 rounded-full bg-stone-500/50" />
        <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-stone-500/50" />

        {/* Joystick Thumb Knob */}
        <div
          className="w-14 h-14 rounded-full bg-gradient-to-b from-stone-700 to-stone-800 border-2 border-stone-500 shadow-xl flex items-center justify-center transition-transform duration-75"
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        >
          <div className="w-5 h-5 rounded-full bg-amber-500/80 shadow-inner" />
        </div>
      </div>

      {/* Action Buttons Cluster (Bottom-Right) */}
      <div className="pointer-events-auto flex items-end gap-3">
        {/* Secondary Buttons Column */}
        <div className="flex flex-col gap-2.5 items-end">
          {/* Boost Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onBoost();
            }}
            onClick={onBoost}
            disabled={boostCooldown > 0 || boostActive}
            className={`w-13 h-13 rounded-2xl flex flex-col items-center justify-center text-xs font-bengali shadow-lg border transition-all active:scale-95 cursor-pointer ${
              boostActive
                ? 'bg-amber-500 text-stone-950 border-amber-300 font-bold shadow-amber-500/50 animate-pulse'
                : boostCooldown > 0
                ? 'bg-stone-900/70 text-stone-500 border-stone-800'
                : 'bg-stone-900/90 text-amber-300 border-amber-500/40 hover:bg-stone-800'
            }`}
          >
            <Zap className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-none font-bold">
              {boostCooldown > 0 ? `${Math.ceil(boostCooldown)}s` : 'বুস্ট'}
            </span>
          </button>

          {/* Quick Evade Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onEvade();
            }}
            onClick={onEvade}
            disabled={evadeCooldown > 0}
            className={`w-13 h-13 rounded-2xl flex flex-col items-center justify-center text-xs font-bengali shadow-lg border transition-all active:scale-95 cursor-pointer ${
              evadeCooldown > 0
                ? 'bg-stone-900/70 text-stone-500 border-stone-800'
                : 'bg-stone-900/90 text-sky-400 border-sky-500/40 hover:bg-stone-800'
            }`}
          >
            <Wind className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-none font-bold">
              {evadeCooldown > 0 ? `${Math.ceil(evadeCooldown)}s` : 'এড়িয়ে যাও'}
            </span>
          </button>

          {/* Sprint Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onToggleSprint(true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onToggleSprint(false);
            }}
            onClick={() => onToggleSprint(!isSprinting)}
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-xs font-bengali shadow-lg border transition-all active:scale-95 cursor-pointer ${
              isSprinting
                ? 'bg-orange-600 text-white border-orange-400 shadow-orange-600/40'
                : 'bg-stone-900/90 text-stone-200 border-stone-700 hover:bg-stone-800'
            }`}
          >
            <Footprints className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] font-bold">দৌড়</span>
          </button>
        </div>

        {/* Primary Collect CHANDA Button (Huge ergonomic button) */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onInteract();
          }}
          onClick={onInteract}
          className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center font-bengali shadow-2xl border-2 transition-all active:scale-90 cursor-pointer ${
            canInteract
              ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-stone-950 border-amber-200 shadow-amber-500/70 scale-105 animate-pulse'
              : 'bg-gradient-to-br from-amber-600/80 to-yellow-800/80 text-amber-100 border-amber-600/50'
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-stone-950/20 flex items-center justify-center mb-1">
            <span className="text-xl font-bold leading-none">৳</span>
          </div>
          <span className="text-sm font-bold tracking-wide">চান্দা</span>
        </button>
      </div>
    </div>
  );
};
