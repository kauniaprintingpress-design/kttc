import React from 'react';
import { Trophy, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';

interface VictoryModalProps {
  levelNumber: number;
  isGameComplete: boolean;
  score: number;
  onNextLevel: () => void;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  levelNumber,
  isGameComplete,
  score,
  onNextLevel,
  onRestart,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-md select-none">
      <div className="relative w-full max-w-md bg-stone-900 border-2 border-amber-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden">
        {/* Confetti & Golden Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Trophy Icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-stone-950 mb-4 shadow-xl shadow-amber-500/40 animate-bounce">
          <Trophy className="w-10 h-10 fill-current" />
        </div>

        {isGameComplete ? (
          <>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-1">
              <Sparkles className="w-4 h-4" />
              <span>চ্যাম্পিয়ন ওস্তাদ</span>
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-bengali tracking-tight mb-1">
              আপনি চান্দা ভাইয়ের আসল ওস্তাদ!
            </h2>
            <p className="text-stone-300 font-bengali text-sm mb-5">
              চান্দা আদায় সফল! পুরো এলাকার সব বাজারের সেরা চাঁদাবাজ!
            </p>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-black text-amber-400 font-bengali tracking-tight mb-1">
              লক্ষ্য পূরণ!
            </h2>
            <div className="text-lg font-bold text-white font-bengali mb-1">
              লেভেল {levelNumber} সম্পন্ন!
            </div>
            <p className="text-stone-300 font-bengali text-sm mb-5">
              চান্দা আদায় সফল! আপনি ৳{score.toLocaleString()} চান্দা সংগ্রহ করেছেন।
            </p>
          </>
        )}

        {/* Score Card */}
        <div className="w-full bg-stone-950/70 border border-stone-800 rounded-2xl p-4 mb-6">
          <div className="text-xs text-stone-400 font-bengali mb-1">মোট চান্দা</div>
          <div className="text-3xl sm:text-4xl font-black text-amber-300 font-num">
            ৳{score.toLocaleString()}
          </div>
          <div className="text-xs text-emerald-400 font-bengali mt-1 font-semibold">
            ✓ সফলভাবে পুলিশের নজর ফাঁকি দেওয়া হয়েছে
          </div>
        </div>

        {/* Next Level or Restart Button */}
        {!isGameComplete ? (
          <button
            onClick={onNextLevel}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-bold text-base font-bengali shadow-xl shadow-amber-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>লেভেল ২ শুরু করুন (ব্যস্ত বাজার)</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={onRestart}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-bold text-base font-bengali shadow-xl shadow-amber-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>নতুন করে আবার খেলুন</span>
          </button>
        )}
      </div>
    </div>
  );
};
