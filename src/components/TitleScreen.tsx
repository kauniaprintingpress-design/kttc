import React from 'react';
import { Play, BookOpen, Volume2, VolumeX, ShieldAlert, Zap } from 'lucide-react';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenRules: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenRules,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-lg bg-stone-900/95 border-2 border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden">
        {/* Decorative background aura */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Character Badge Image */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-2 border-amber-500/60 shadow-xl overflow-hidden mb-4 bg-stone-800 shrink-0">
          <img
            src="/src/assets/images/chanda_bhai_hero_1793039622291.jpg"
            alt="চান্দা ভাই"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Bespoke inline SVG Title Lockup */}
        <div className="mb-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
              Bangladeshi Street Arcade
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white font-bengali tracking-tight drop-shadow-md">
            চান্দা ভাই
          </h1>
          <p className="text-stone-300 font-bengali text-sm sm:text-base mt-1 font-medium">
            "চান্দা আদায় করো, ধরা পড়ো না!"
          </p>
        </div>

        {/* Objective Pill */}
        <div className="w-full bg-stone-950/60 border border-stone-800/80 rounded-xl p-3 my-4 text-xs font-bengali text-stone-300 flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>মূল লক্ষ্য: চান্দা আদায়ের লক্ষ্য পূরণ করা এবং পুলিশের হাত থেকে বেঁচে থাকা!</span>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col w-full gap-2.5 mt-2">
          <button
            onClick={onStartGame}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-bold text-lg font-bengali shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>খেলা শুরু করুন</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5 w-full">
            <button
              onClick={onOpenRules}
              className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700/80 border border-stone-700 text-stone-200 text-sm font-semibold font-bengali transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>খেলার নিয়ম</span>
            </button>

            <button
              onClick={onToggleMute}
              className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700/80 border border-stone-700 text-stone-200 text-sm font-semibold font-bengali transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-red-400" />
                  <span>সাউন্ড: OFF</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>সাউন্ড: ON</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Flat control-hint line as per design guidelines */}
        <div className="mt-5 text-[11px] text-stone-400 flex items-center justify-center gap-3 font-mono">
          <span>WASD Move</span>
          <span>·</span>
          <span>Shift Sprint</span>
          <span>·</span>
          <span>Space Evade</span>
          <span>·</span>
          <span className="text-amber-400 font-bold">E Chanda</span>
        </div>
      </div>
    </div>
  );
};
