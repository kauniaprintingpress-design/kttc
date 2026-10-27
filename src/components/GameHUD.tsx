import React from 'react';
import { Volume2, VolumeX, Pause, Zap, ShieldAlert, Award } from 'lucide-react';
import { GameWorld } from '../game/GameWorld';

interface GameHUDProps {
  world: GameWorld;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onActivateBoost: () => void;
  onActivateEvade: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  world,
  isMuted,
  onToggleMute,
  onPause,
  onActivateBoost,
  onActivateEvade,
}) => {
  const currentChanda = world.chandaScore;
  const targetChanda = world.level.targetChanda;
  const progressPercent = Math.min(100, Math.round((currentChanda / targetChanda) * 100));

  const risk = Math.round(world.riskMeter);
  const isHighRisk = risk >= 75;
  const isMediumRisk = risk >= 40 && risk < 75;

  const riskLabel = isHighRisk ? 'চরম ঝুঁকি' : isMediumRisk ? 'মাঝারি ঝুঁকি' : 'কম ঝুঁকি';
  const riskColor = isHighRisk ? 'bg-red-600' : isMediumRisk ? 'bg-amber-500' : 'bg-emerald-500';

  const boostCooldown = Math.ceil(world.player.boostCooldown);
  const boostActive = world.player.boostActive;
  const evadeCooldown = Math.ceil(world.player.evadeCooldown);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-3 md:p-5 select-none">
      {/* High Risk Screen Danger Vignette */}
      {isHighRisk && (
        <div className="fixed inset-0 pointer-events-none danger-vignette z-0 border-4 border-red-600/40" />
      )}

      {/* Top Header Cluster */}
      <header className="relative z-10 flex items-start justify-between gap-3 w-full max-w-7xl mx-auto">
        {/* Left: Brand & Level Badge */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-stone-900/90 border border-stone-800 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-sm">
              ৳
            </div>
            <div>
              <div className="text-white font-bold text-base leading-tight tracking-wide flex items-center gap-1.5 font-bengali">
                চান্দা ভাই
              </div>
              <div className="text-xs text-amber-400/90 font-medium font-bengali">
                লেভেল {world.level.levelNumber}: {world.level.name}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Chanda Target & Progress Bar */}
        <div className="flex flex-col items-center bg-stone-900/90 border border-stone-800 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg min-w-[210px] sm:min-w-[280px]">
          <div className="flex items-center justify-between w-full text-xs font-semibold mb-1 text-stone-300">
            <span className="font-bengali text-stone-400">
              লক্ষ্য: <span className="font-num text-white">৳{targetChanda.toLocaleString()}</span>
            </span>
            <span className="font-bengali text-amber-400">
              চান্দা: <span className="font-num font-bold text-amber-300 text-sm">৳{currentChanda.toLocaleString()}</span>
            </span>
          </div>

          {/* Progress track */}
          <div className="w-full bg-stone-800 h-2.5 rounded-full overflow-hidden border border-stone-700/60 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 rounded-full transition-all duration-300 ease-out shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between w-full mt-1 text-[11px] text-stone-400 font-num">
            <span>{progressPercent}% সম্পন্ন</span>
            {world.nearestNpc && (
              <span className="text-amber-400 font-bengali animate-pulse">কাছে NPC আছে!</span>
            )}
          </div>
        </div>

        {/* Right: Risk Meter & Controls */}
        <div className="flex items-center gap-2">
          {/* Risk Meter Container */}
          <div className="hidden sm:flex flex-col items-end bg-stone-900/90 border border-stone-800 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg">
            <div className="flex items-center gap-1.5 text-xs font-medium text-stone-300 font-bengali">
              <ShieldAlert className={`w-3.5 h-3.5 ${isHighRisk ? 'text-red-400 animate-bounce' : 'text-stone-400'}`} />
              <span>ধরা পড়ার ঝুঁকি:</span>
              <span className={`font-semibold ${isHighRisk ? 'text-red-400' : isMediumRisk ? 'text-amber-400' : 'text-emerald-400'}`}>
                {riskLabel} ({risk}%)
              </span>
            </div>
            <div className="w-28 bg-stone-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full ${riskColor} transition-all duration-200`}
                style={{ width: `${risk}%` }}
              />
            </div>
          </div>

          {/* Sound & Pause action buttons */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={onToggleMute}
              className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 hover:border-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer shadow-md"
              title={isMuted ? 'সাউন্ড চালু করুন' : 'সাউন্ড বন্ধ করুন'}
              aria-label="Sound Toggle"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={onPause}
              className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 hover:border-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer shadow-md"
              title="খেলা বিরতি"
              aria-label="Pause"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Middle Banner Notification */}
      {world.randomEventBanner && (
        <div className="self-center mt-2 animate-bounce">
          <div className="bg-red-600/95 border border-red-500 text-white font-bold px-4 py-1.5 rounded-full shadow-2xl text-xs sm:text-sm font-bengali tracking-wide flex items-center gap-2">
            <span>{world.randomEventBanner}</span>
          </div>
        </div>
      )}

      {/* High-risk warning alert banner */}
      {isHighRisk && !world.randomEventBanner && (
        <div className="self-center mt-2">
          <div className="bg-red-600/90 border border-red-400 text-white font-bold px-4 py-1 rounded-full shadow-2xl text-xs font-bengali flex items-center gap-1.5 animate-pulse">
            <ShieldAlert className="w-4 h-4 text-amber-300" />
            <span>সাবধান! পুলিশ/ধাওয়া শুরু হতে পারে! লুকিয়ে পড়ুন!</span>
          </div>
        </div>
      )}

      {/* Bottom Desktop Ability Bar (Desktop helper hints) */}
      <footer className="relative z-10 hidden md:flex items-center justify-between w-full max-w-4xl mx-auto pb-1 text-xs text-stone-400">
        <div className="flex items-center gap-4 bg-stone-900/80 border border-stone-800/80 px-4 py-2 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-stone-800 border border-stone-700 rounded text-stone-200 font-mono text-[11px]">WASD</kbd>
            <span className="font-bengali">চলাচল</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-stone-800 border border-stone-700 rounded text-stone-200 font-mono text-[11px]">SHIFT</kbd>
            <span className="font-bengali">দৌড়</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-stone-800 border border-stone-700 rounded text-stone-200 font-mono text-[11px]">SPACE</kbd>
            <span className="font-bengali">এড়িয়ে যাও</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/50 text-amber-300 rounded font-mono text-[11px]">E</kbd>
            <span className="font-bengali text-amber-300 font-medium">চান্দা সংগ্রহ</span>
          </div>
        </div>

        {/* Power cooldown tags */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onActivateBoost}
            disabled={boostCooldown > 0 || boostActive}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bengali transition-colors cursor-pointer ${
              boostActive
                ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold animate-pulse'
                : boostCooldown > 0
                ? 'bg-stone-900/60 border-stone-800 text-stone-500 cursor-not-allowed'
                : 'bg-stone-900 border-amber-500/50 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{boostActive ? 'স্পিড বুস্ট চালু!' : boostCooldown > 0 ? `বুস্ট (${boostCooldown}s)` : 'স্পিড বুস্ট'}</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
