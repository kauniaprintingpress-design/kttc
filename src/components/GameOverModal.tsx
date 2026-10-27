import React from 'react';
import { RotateCcw, AlertOctagon } from 'lucide-react';

interface GameOverModalProps {
  finalScore: number;
  targetScore: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  finalScore,
  targetScore,
  onRestart,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-md select-none">
      <div className="relative w-full max-w-md bg-stone-900 border-2 border-red-900/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Siren Glow */}
        <div className="w-20 h-20 rounded-full bg-red-600/20 border-2 border-red-500/50 flex items-center justify-center text-red-500 mb-4 animate-pulse shadow-lg shadow-red-500/30">
          <AlertOctagon className="w-10 h-10" />
        </div>

        {/* Title */}
        <h2 className="text-3xl font-black text-red-500 font-bengali tracking-tight mb-1">
          ধরা পড়ে গেছেন!
        </h2>
        <p className="text-stone-300 font-bengali text-sm mb-5">
          লক্ষ্য পূরণ করার আগে ধরা পড়ে গেছেন।
        </p>

        {/* Score Summary Box */}
        <div className="w-full bg-stone-950/70 border border-stone-800 rounded-2xl p-4 mb-6">
          <div className="text-xs text-stone-400 font-bengali mb-1">আপনার সংগৃহীত</div>
          <div className="text-3xl font-black text-amber-400 font-num">
            ৳{finalScore.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500 font-bengali mt-1">
            লেভেল টার্গেট ছিল ৳{targetScore.toLocaleString()}
          </div>
        </div>

        {/* Restart Button */}
        <button
          onClick={onRestart}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-base font-bengali shadow-xl shadow-red-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>আবার খেলুন</span>
        </button>
      </div>
    </div>
  );
};
