/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState } from './types/game';
import { GameWorld } from './game/GameWorld';
import { GameRenderer } from './game/GameRenderer';
import { soundManager } from './audio/soundManager';
import { GameHUD } from './components/GameHUD';
import { MobileControls } from './components/MobileControls';
import { TitleScreen } from './components/TitleScreen';
import { RulesModal } from './components/RulesModal';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';
import { PauseModal } from './components/PauseModal';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<GameWorld>(new GameWorld(1));
  const rendererRef = useRef<GameRenderer | null>(null);

  const [gameState, setGameState] = useState<GameState>('START');
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.isMuted());
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  // HUD sync state (synced with low frequency to prevent high-rate React re-renders)
  const [hudTick, setHudTick] = useState<number>(0);

  // Input states
  const keysHeld = useRef<Record<string, boolean>>({});
  const mobileMoveVector = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isMobileSprinting = useRef<boolean>(false);

  // Detect touch device
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();
    window.addEventListener('touchstart', checkTouch, { once: true });
  }, []);

  // Initialize Canvas & Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new GameRenderer(canvas);
    rendererRef.current = renderer;
    renderer.setBackgroundImage(worldRef.current.level.backgroundImageUrl);

    // Responsive Canvas Resize
    const handleResize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;

      // Escape / P for Pause
      if (code === 'KeyP' || code === 'Escape') {
        if (gameState === 'PLAYING') {
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
        }
        return;
      }

      // Action: Interact (E)
      if (code === 'KeyE') {
        if (gameState === 'PLAYING') {
          worldRef.current.interactWithNearestNpc();
        }
        return;
      }

      // Action: Evade (Space)
      if (code === 'Space') {
        if (gameState === 'PLAYING') {
          e.preventDefault();
          worldRef.current.activatePlayerEvade();
        } else if (gameState === 'START') {
          handleStartGame();
        }
        return;
      }

      // Action: Boost (B)
      if (code === 'KeyB') {
        if (gameState === 'PLAYING') {
          worldRef.current.activateSpeedBoost();
        }
        return;
      }

      keysHeld.current[code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysHeld.current[e.code] = false;
    };

    const handleBlur = () => {
      keysHeld.current = {};
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState]);

  // Main 60fps Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let hudSyncAccumulator = 0;

    const gameLoop = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05); // Clamp dt to prevent tunneling

      const world = worldRef.current;
      const renderer = rendererRef.current;

      if (gameState === 'PLAYING') {
        // Calculate move vector from keyboard + virtual joystick
        let moveX = mobileMoveVector.current.x;
        let moveY = mobileMoveVector.current.y;

        const kh = keysHeld.current;
        if (kh['KeyW'] || kh['ArrowUp']) moveY -= 1;
        if (kh['KeyS'] || kh['ArrowDown']) moveY += 1;
        if (kh['KeyA'] || kh['ArrowLeft']) moveX -= 1;
        if (kh['KeyD'] || kh['ArrowRight']) moveX += 1;

        // Sprint state
        const isSprinting = Boolean(kh['ShiftLeft'] || kh['ShiftRight'] || isMobileSprinting.current);
        world.setPlayerSprinting(isSprinting);

        // Simulation update
        world.update(dt, { x: moveX, y: moveY });

        // Check Caught State
        if (world.isGameOver) {
          setGameState('CAUGHT');
        }

        // Check Win State
        if (world.isLevelWon) {
          if (world.level.levelNumber >= 2) {
            setGameState('GAME_COMPLETE');
          } else {
            setGameState('LEVEL_COMPLETE');
          }
        }
      }

      // Render frame
      if (renderer && canvasRef.current) {
        renderer.render(world, dt);
      }

      // Throttle React HUD updates to ~12fps to avoid re-rendering DOM every frame
      hudSyncAccumulator += dt;
      if (hudSyncAccumulator >= 0.08) {
        hudSyncAccumulator = 0;
        setHudTick((prev) => prev + 1);
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  // Actions
  const handleStartGame = useCallback(() => {
    setGameState('PLAYING');
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleRestartLevel = useCallback(() => {
    const newWorld = new GameWorld(currentLevel);
    worldRef.current = newWorld;
    rendererRef.current?.setBackgroundImage(newWorld.level.backgroundImageUrl);
    setGameState('PLAYING');
  }, [currentLevel]);

  const handleNextLevel = useCallback(() => {
    const nextLvl = currentLevel + 1;
    setCurrentLevel(nextLvl);
    const newWorld = new GameWorld(nextLvl);
    worldRef.current = newWorld;
    rendererRef.current?.setBackgroundImage(newWorld.level.backgroundImageUrl);
    setGameState('PLAYING');
  }, [currentLevel]);

  const handleRestartFromBeginning = useCallback(() => {
    setCurrentLevel(1);
    const newWorld = new GameWorld(1);
    worldRef.current = newWorld;
    rendererRef.current?.setBackgroundImage(newWorld.level.backgroundImageUrl);
    setGameState('PLAYING');
  }, []);

  const handleInteract = useCallback(() => {
    if (gameState === 'PLAYING') {
      worldRef.current.interactWithNearestNpc();
    }
  }, [gameState]);

  const handleEvade = useCallback(() => {
    if (gameState === 'PLAYING') {
      worldRef.current.activatePlayerEvade();
    }
  }, [gameState]);

  const handleBoost = useCallback(() => {
    if (gameState === 'PLAYING') {
      worldRef.current.activateSpeedBoost();
    }
  }, [gameState]);

  const handleMobileMoveVector = useCallback((vector: { x: number; y: number }) => {
    mobileMoveVector.current = vector;
  }, []);

  const handleToggleSprint = useCallback((sprint: boolean) => {
    isMobileSprinting.current = sprint;
    worldRef.current.setPlayerSprinting(sprint);
  }, []);

  const world = worldRef.current;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-stone-950 font-bengali">
      {/* 2.5D Isolated Arcade Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block bg-stone-950 cursor-crosshair touch-none"
      />

      {/* In-Game Heads-Up Display */}
      {gameState === 'PLAYING' && (
        <>
          <GameHUD
            world={world}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onPause={() => setGameState('PAUSED')}
            onActivateBoost={handleBoost}
            onActivateEvade={handleEvade}
          />

          {/* Mobile Joystick & Touch Buttons */}
          <MobileControls
            onMoveVectorChange={handleMobileMoveVector}
            onInteract={handleInteract}
            onToggleSprint={handleToggleSprint}
            onEvade={handleEvade}
            onBoost={handleBoost}
            canInteract={Boolean(world.nearestNpc && world.nearestNpc.cooldownTimer <= 0)}
            isSprinting={world.player.isSprinting}
            boostActive={world.player.boostActive}
            boostCooldown={world.player.boostCooldown}
            evadeCooldown={world.player.evadeCooldown}
          />
        </>
      )}

      {/* Modals & Game State Overlays */}
      {gameState === 'START' && (
        <TitleScreen
          onStartGame={handleStartGame}
          onOpenRules={() => setGameState('RULES')}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {gameState === 'RULES' && (
        <RulesModal
          onClose={() => setGameState('START')}
          onStart={handleStartGame}
        />
      )}

      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={() => setGameState('PLAYING')}
          onRestart={handleRestartLevel}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {gameState === 'CAUGHT' && (
        <GameOverModal
          finalScore={world.chandaScore}
          targetScore={world.level.targetChanda}
          onRestart={handleRestartLevel}
        />
      )}

      {(gameState === 'LEVEL_COMPLETE' || gameState === 'GAME_COMPLETE') && (
        <VictoryModal
          levelNumber={world.level.levelNumber}
          isGameComplete={gameState === 'GAME_COMPLETE'}
          score={world.chandaScore}
          onNextLevel={handleNextLevel}
          onRestart={handleRestartFromBeginning}
        />
      )}
    </main>
  );
}
