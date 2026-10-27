import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-sm bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        <h2 className="text-2xl font-bold text-white font-bengali mb-1">খেলা সাময়িক বিরতি</h2>
        <p className="text-stone-400 font-bengali text-xs mb-6">চা পান শেষ হলে আবার শুরু করুন!</p>

        <div className="flex flex-col w-full gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold font-bengali transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>চালিয়ে যান</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-sm font-semibold font-bengali transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-red-400" />
                <span>সাউন্ড চালু করুন</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>সাউন্ড বন্ধ করুন</span>
              </>
            )}
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 px-4 rounded-xl bg-stone-800/80 hover:bg-stone-700 border border-stone-700 text-stone-300 text-sm font-semibold font-bengali transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>পুনরায় শুরু করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
