import {
  FloatingText,
  LevelConfig,
  NPC,
  NpcType,
  Particle,
  PlayerState,
  PowerUpItem,
  Pursuer,
  RectCollider,
  Vehicle,
} from '../types/game';
import {
  BENGALI_SHOP_NAMES,
  CHANDA_AMOUNTS,
  DIALOGUE_REFUSE,
  DIALOGUE_SUCCESS,
  LEVEL_CONFIGS,
  PURSUER_CALLS,
} from './constants';
import { soundManager } from '../audio/soundManager';

export class GameWorld {
  public level: LevelConfig;
  public player: PlayerState;
  public npcs: NPC[] = [];
  public pursuers: Pursuer[] = [];
  public vehicles: Vehicle[] = [];
  public colliders: RectCollider[] = [];
  public floatingTexts: FloatingText[] = [];
  public particles: Particle[] = [];
  public powerUps: PowerUpItem[] = [];

  public chandaScore: number = 0;
  public riskMeter: number = 0; // 0 to 100
  public nearestNpc: NPC | null = null;
  public nearestPursuer: Pursuer | null = null;
  public nearestPursuerDistance: number = 9999;
  public nearestPursuerAngle: number = 0; // radians for HUD pointer

  public isGameOver: boolean = false;
  public isLevelWon: boolean = false;
  public randomEventBanner: string | null = null;
  private randomEventTimer: number = 0;

  private vehicleSpawnTimer: number = 0;
  private timeSinceLastChanda: number = 0;

  constructor(levelNumber: number = 1) {
    this.level = LEVEL_CONFIGS[levelNumber] || LEVEL_CONFIGS[1];
    
    // Initial player state at center of road
    this.player = {
      x: 350,
      y: this.level.worldHeight / 2 + 50,
      vx: 0,
      vy: 0,
      facing: 'right',
      width: 44,
      height: 60,
      speed: 210,
      isSprinting: false,
      isEvading: false,
      evadeCooldown: 0,
      boostActive: false,
      boostTimeRemaining: 0,
      boostCooldown: 0,
      walkFrame: 0,
      isCaught: false,
      caughtAnimationTimer: 0,
    };

    this.initWorld();
  }

  private initWorld() {
    this.buildColliders();
    this.spawnInitialNpcs();
    this.spawnPowerUps();
  }

  // Setup buildings, shops, roadside trees, and poles as solid colliders
  private buildColliders() {
    this.colliders = [];
    const w = this.level.worldWidth;
    const h = this.level.worldHeight;

    // Outer perimeter boundaries
    this.colliders.push({ x: 0, y: 0, width: w, height: 100, label: 'North Boundary' });
    this.colliders.push({ x: 0, y: h - 90, width: w, height: 100, label: 'South Boundary' });
    this.colliders.push({ x: 0, y: 0, width: 60, height: h, label: 'West Boundary' });
    this.colliders.push({ x: w - 60, y: 0, width: 60, height: h, label: 'East Boundary' });

    // Roadside shop structures (North side)
    const shopWidth = 140;
    const shopGap = 35;
    let currentX = 100;
    let shopIdx = 0;

    while (currentX < w - 200) {
      const name = BENGALI_SHOP_NAMES[shopIdx % BENGALI_SHOP_NAMES.length];
      this.colliders.push({
        x: currentX,
        y: 100,
        width: shopWidth,
        height: 140,
        label: name,
      });

      // Wooden bench or fruit stall in front
      if (shopIdx % 3 === 0) {
        this.colliders.push({
          x: currentX + 25,
          y: 250,
          width: 50,
          height: 25,
          label: 'বেঞ্চ',
        });
      }

      currentX += shopWidth + shopGap;
      shopIdx++;
    }

    // South side shops and structures
    currentX = 140;
    while (currentX < w - 250) {
      const name = BENGALI_SHOP_NAMES[(shopIdx + 4) % BENGALI_SHOP_NAMES.length];
      this.colliders.push({
        x: currentX,
        y: h - 230,
        width: shopWidth + 20,
        height: 140,
        label: name,
      });

      // Roadside tea stall or cart
      if (shopIdx % 2 === 0) {
        this.colliders.push({
          x: currentX + 30,
          y: h - 265,
          width: 45,
          height: 30,
          label: 'চা টং',
        });
      }

      currentX += shopWidth + 50;
      shopIdx++;
    }

    // Utility concrete poles with electric wire roots along road
    for (let px = 220; px < w - 100; px += 340) {
      this.colliders.push({
        x: px,
        y: 290,
        width: 22,
        height: 22,
        label: 'বিদ্যুৎ খুঁটি',
      });
      this.colliders.push({
        x: px + 170,
        y: h - 300,
        width: 22,
        height: 22,
        label: 'বিদ্যুৎ খুঁটি',
      });
    }

    // Roadside trees and banana groves
    for (let tx = 180; tx < w - 150; tx += 420) {
      this.colliders.push({
        x: tx + 80,
        y: 270,
        width: 32,
        height: 32,
        label: 'গাছ',
      });
      this.colliders.push({
        x: tx + 240,
        y: h - 280,
        width: 32,
        height: 32,
        label: 'কলা গাছ',
      });
    }
  }

  // Populate NPCs in shops and along pavements
  private spawnInitialNpcs() {
    this.npcs = [];
    const count = this.level.npcCount;
    const types: NpcType[] = ['SHOPKEEPER', 'PEDESTRIAN', 'BUSINESSMAN', 'REFUSER', 'VIP_BONUS'];

    for (let i = 0; i < count; i++) {
      let type: NpcType;
      // Guarantee good mix
      if (i < 6) type = 'SHOPKEEPER';
      else if (i < 12) type = 'PEDESTRIAN';
      else if (i < 16) type = 'BUSINESSMAN';
      else if (i === 17) type = 'VIP_BONUS';
      else type = types[Math.floor(Math.random() * (types.length - 1))];

      let x = 180 + (i * (this.level.worldWidth - 400)) / count + (Math.random() * 80 - 40);
      let y: number;

      if (type === 'SHOPKEEPER') {
        // Positioned in front of shops
        y = i % 2 === 0 ? 255 + Math.random() * 20 : this.level.worldHeight - 270 - Math.random() * 20;
      } else {
        // Along sidewalks and road shoulders
        y = 310 + Math.random() * (this.level.worldHeight - 640);
      }

      const chandaVal =
        type === 'SHOPKEEPER'
          ? CHANDA_AMOUNTS.SHOPKEEPER
          : type === 'PEDESTRIAN'
          ? CHANDA_AMOUNTS.PEDESTRIAN
          : type === 'BUSINESSMAN'
          ? CHANDA_AMOUNTS.BUSINESSMAN
          : type === 'VIP_BONUS'
          ? CHANDA_AMOUNTS.VIP_BONUS
          : 0;

      const successList =
        type === 'SHOPKEEPER'
          ? DIALOGUE_SUCCESS.SHOPKEEPER
          : type === 'PEDESTRIAN'
          ? DIALOGUE_SUCCESS.PEDESTRIAN
          : type === 'BUSINESSMAN'
          ? DIALOGUE_SUCCESS.BUSINESSMAN
          : DIALOGUE_SUCCESS.VIP_BONUS;

      const dialogueSuccess = successList[Math.floor(Math.random() * successList.length)];
      const dialogueRefuse = DIALOGUE_REFUSE[Math.floor(Math.random() * DIALOGUE_REFUSE.length)];

      this.npcs.push({
        id: `npc_${i}_${Date.now()}`,
        name: type === 'SHOPKEEPER' ? 'দোকানদার' : type === 'PEDESTRIAN' ? 'পথচারী' : type === 'BUSINESSMAN' ? 'ব্যবসায়ী' : type === 'VIP_BONUS' ? 'ভিআইপি চান্দা' : 'প্রতিবাদী',
        type,
        x,
        y,
        vx: (Math.random() - 0.5) * 20,
        vy: 0,
        facing: Math.random() > 0.5 ? 'right' : 'left',
        width: 36,
        height: 52,
        chandaValue: chandaVal,
        dialogueSuccess,
        dialogueRefuse,
        state: 'idle',
        cooldownTimer: 0,
        patrolMinX: Math.max(120, x - 120),
        patrolMaxX: Math.min(this.level.worldWidth - 120, x + 120),
        walkFrame: Math.random() * 10,
        speechTimer: 0,
      });
    }
  }

  // Scattered powerups on the roadside (hot tea for speed boost or coin stash)
  private spawnPowerUps() {
    this.powerUps = [
      {
        id: 'chai_1',
        type: 'speed_chai',
        x: 600,
        y: this.level.worldHeight / 2 - 80,
        width: 30,
        height: 30,
        collected: false,
      },
      {
        id: 'chai_2',
        type: 'speed_chai',
        x: 1600,
        y: this.level.worldHeight / 2 + 100,
        width: 30,
        height: 30,
        collected: false,
      },
      {
        id: 'chai_3',
        type: 'speed_chai',
        x: 2300,
        y: this.level.worldHeight / 2 - 40,
        width: 30,
        height: 30,
        collected: false,
      },
    ];
  }

  // Spawn dynamic traffic like bicycle or CNG auto-rickshaw
  private spawnVehicle() {
    const isRight = Math.random() > 0.5;
    const types: ('bicycle' | 'motorcycle' | 'cng_auto')[] = ['bicycle', 'motorcycle', 'cng_auto'];
    const type = types[Math.floor(Math.random() * types.length)];
    const speed = type === 'bicycle' ? 140 : type === 'cng_auto' ? 190 : 240;

    const yRoadLane =
      this.level.worldHeight / 2 + (isRight ? 30 : -30) + (Math.random() * 30 - 15);

    this.vehicles.push({
      id: `veh_${Date.now()}_${Math.random()}`,
      type,
      x: isRight ? -100 : this.level.worldWidth + 100,
      y: yRoadLane,
      vx: isRight ? speed : -speed,
      direction: isRight ? 'right' : 'left',
      width: type === 'cng_auto' ? 68 : type === 'motorcycle' ? 48 : 38,
      height: type === 'cng_auto' ? 44 : 26,
      label: type === 'cng_auto' ? 'সিএনজি' : type === 'motorcycle' ? 'মোটরসাইকেল' : 'বাইসাইকেল',
    });
  }

  // Spawn Pursuer (পুলিশ / ধাওয়া)
  public spawnPursuer(spawnNearPlayer = false) {
    if (this.pursuers.length >= 3) return; // Max 3 pursuers concurrently

    let x: number;
    let y: number;

    if (spawnNearPlayer) {
      const angle = Math.random() * Math.PI * 2;
      x = this.player.x + Math.cos(angle) * 350;
      y = this.player.y + Math.sin(angle) * 300;
    } else {
      // Spawn from road edge
      const spawnFromLeft = Math.random() > 0.5;
      x = spawnFromLeft ? 50 : this.level.worldWidth - 50;
      y = this.level.worldHeight / 2 + (Math.random() * 100 - 50);
    }

    // Clamp within world
    x = Math.max(80, Math.min(this.level.worldWidth - 80, x));
    y = Math.max(160, Math.min(this.level.worldHeight - 160, y));

    const callText = PURSUER_CALLS[Math.floor(Math.random() * PURSUER_CALLS.length)];

    this.pursuers.push({
      id: `pursuer_${Date.now()}_${Math.random()}`,
      name: 'আইনশৃঙ্খলা রক্ষাকারী',
      x,
      y,
      vx: 0,
      vy: 0,
      facing: x < this.player.x ? 'right' : 'left',
      width: 40,
      height: 58,
      speed: this.level.pursuerSpeed + (Math.random() * 20 - 10),
      state: 'chasing',
      searchTimer: 0,
      speechText: callText,
      speechTimer: 2.5,
      walkFrame: 0,
    });

    soundManager.playPursuerAlert();
    this.showBanner('🚨 সাবধান! ধাওয়া শুরু হয়েছে!');
  }

  // Player action: Interact / Collect Chanda
  public interactWithNearestNpc(): boolean {
    if (this.isGameOver || this.isLevelWon) return false;
    if (!this.nearestNpc) return false;

    const npc = this.nearestNpc;
    if (npc.cooldownTimer > 0 || npc.state === 'fleeing') return false;

    this.timeSinceLastChanda = 0;

    // Check if this NPC refuses (18% probability if type is not guaranteed VIP)
    const isRefuser = npc.type === 'REFUSER' || (npc.type !== 'VIP_BONUS' && Math.random() < 0.16);

    if (isRefuser) {
      // NPC refuses & flees
      npc.state = 'fleeing';
      npc.cooldownTimer = 7.0;
      npc.speechText = npc.dialogueRefuse;
      npc.speechTimer = 2.5;
      npc.vx = (npc.x > this.player.x ? 1 : -1) * 160;
      soundManager.playRefuse();

      this.addFloatingText('না ভাই পারব না!', npc.x, npc.y - 45, '#ef4444');
      this.increaseRisk(6); // Small agitation
      return false;
    }

    // Successful collection!
    const collectedAmount = npc.chandaValue;
    this.chandaScore += collectedAmount;
    npc.state = 'collected';
    npc.cooldownTimer = 8.0; // Cooldown before they can give again
    npc.speechText = npc.dialogueSuccess;
    npc.speechTimer = 2.0;

    // Risk increases scaled by collection amount
    const riskIncrement = collectedAmount >= 500 ? 30 : collectedAmount >= 200 ? 20 : 12;
    this.increaseRisk(riskIncrement);

    // Audio & Visual rewards
    soundManager.playChandaCollect(collectedAmount);
    this.addFloatingText(`+৳${collectedAmount} চান্দা!`, npc.x, npc.y - 45, '#fbbf24', collectedAmount);
    this.createBurstParticles(npc.x, npc.y - 20, '#fbbf24', 16);

    // Check target reached!
    if (this.chandaScore >= this.level.targetChanda) {
      this.isLevelWon = true;
      soundManager.playWin();
    }

    return true;
  }

  // Player action: Sprint Toggle/State
  public setPlayerSprinting(sprint: boolean) {
    this.player.isSprinting = sprint;
  }

  // Player action: Quick Evade / Dash
  public activatePlayerEvade(): boolean {
    if (this.player.evadeCooldown > 0 || this.player.isEvading) return false;

    this.player.isEvading = true;
    this.player.evadeCooldown = 2.8;

    // Dash burst in facing direction or velocity direction
    let dirX = this.player.facing === 'left' ? -1 : this.player.facing === 'right' ? 1 : 0;
    let dirY = this.player.facing === 'up' ? -1 : this.player.facing === 'down' ? 1 : 0;

    if (this.player.vx !== 0 || this.player.vy !== 0) {
      const mag = Math.hypot(this.player.vx, this.player.vy) || 1;
      dirX = this.player.vx / mag;
      dirY = this.player.vy / mag;
    }

    const dashDistance = 110;
    const targetX = this.player.x + dirX * dashDistance;
    const targetY = this.player.y + dirY * dashDistance;

    // Check collision along dash
    if (!this.checkColliderCollision(targetX, targetY, this.player.width, this.player.height)) {
      this.player.x = targetX;
      this.player.y = targetY;
    }

    soundManager.playEvade();
    this.createBurstParticles(this.player.x, this.player.y, '#38bdf8', 12);

    setTimeout(() => {
      this.player.isEvading = false;
    }, 200);

    return true;
  }

  // Player action: Sprint Boost Special Power
  public activateSpeedBoost(): boolean {
    if (this.player.boostCooldown > 0 || this.player.boostActive) return false;

    this.player.boostActive = true;
    this.player.boostTimeRemaining = 5.0; // 5 seconds
    this.player.boostCooldown = 14.0; // 14s cooldown

    soundManager.playBoost();
    this.showBanner('⚡ স্পিড বুস্ট চালু! দ্রুত পালিয়ে যান!');
    this.createBurstParticles(this.player.x, this.player.y, '#f59e0b', 20);
    return true;
  }

  // Risk management
  private increaseRisk(amount: number) {
    this.riskMeter = Math.min(100, this.riskMeter + amount);

    if (this.riskMeter >= 75) {
      soundManager.playRiskWarning();
      if (this.pursuers.length === 0) {
        this.spawnPursuer();
      }
    }
  }

  public showBanner(msg: string) {
    this.randomEventBanner = msg;
    this.randomEventTimer = 3.5;
  }

  // Main simulation tick (called with delta time clamped $\le 0.05$)
  public update(dt: number, moveVector: { x: number; y: number }) {
    if (this.isGameOver || this.isLevelWon) {
      if (this.player.isCaught) {
        this.player.caughtAnimationTimer += dt;
      }
      return;
    }

    // Update timers
    if (this.randomEventTimer > 0) {
      this.randomEventTimer -= dt;
      if (this.randomEventTimer <= 0) {
        this.randomEventBanner = null;
      }
    }

    // Cooldown timers
    if (this.player.evadeCooldown > 0) {
      this.player.evadeCooldown = Math.max(0, this.player.evadeCooldown - dt);
    }
    if (this.player.boostCooldown > 0) {
      this.player.boostCooldown = Math.max(0, this.player.boostCooldown - dt);
    }
    if (this.player.boostActive) {
      this.player.boostTimeRemaining -= dt;
      if (this.player.boostTimeRemaining <= 0) {
        this.player.boostActive = false;
      }
    }

    // Risk decays over time if not engaging
    this.timeSinceLastChanda += dt;
    if (this.timeSinceLastChanda > 2.0 && this.riskMeter > 0) {
      this.riskMeter = Math.max(0, this.riskMeter - 4.5 * dt);
    }

    // Sound siren when pursuer is chasing
    const hasActiveChaser = this.pursuers.some((p) => p.state === 'chasing');
    if (hasActiveChaser) {
      soundManager.startSiren();
    } else {
      soundManager.stopSiren();
    }

    // 1. Move Player
    this.updatePlayer(dt, moveVector);

    // 2. Update NPCs
    this.updateNpcs(dt);

    // 3. Update Pursuers
    this.updatePursuers(dt);

    // 4. Update Vehicles
    this.updateVehicles(dt);

    // 5. Update PowerUps & Check Player Collection
    this.updatePowerUps();

    // 6. Update Particles & Floating Text
    this.updateEffects(dt);

    // 7. Check Spawns & Random Events
    this.checkDynamicSpawns(dt);
  }

  private updatePlayer(dt: number, moveVector: { x: number; y: number }) {
    let speed = this.player.speed;
    if (this.player.boostActive) speed *= 1.65;
    else if (this.player.isSprinting) speed *= 1.35;

    // Normalizing diagonal input
    const inputMag = Math.hypot(moveVector.x, moveVector.y);
    let vx = 0;
    let vy = 0;

    if (inputMag > 0.05) {
      vx = (moveVector.x / inputMag) * speed;
      vy = (moveVector.y / inputMag) * speed;

      // Update facing
      if (Math.abs(moveVector.x) > Math.abs(moveVector.y)) {
        this.player.facing = moveVector.x > 0 ? 'right' : 'left';
      } else {
        this.player.facing = moveVector.y > 0 ? 'down' : 'up';
      }

      this.player.walkFrame += dt * (this.player.isSprinting ? 14 : 9);
      soundManager.playStep();
    } else {
      this.player.walkFrame = 0;
    }

    this.player.vx = vx;
    this.player.vy = vy;

    // Move with collision detection (axis-by-axis sliding)
    const newX = this.player.x + vx * dt;
    if (!this.checkColliderCollision(newX, this.player.y, this.player.width, this.player.height)) {
      this.player.x = newX;
    }

    const newY = this.player.y + vy * dt;
    if (!this.checkColliderCollision(this.player.x, newY, this.player.width, this.player.height)) {
      this.player.y = newY;
    }

    // Clamp to world
    this.player.x = Math.max(40, Math.min(this.level.worldWidth - 40, this.player.x));
    this.player.y = Math.max(120, Math.min(this.level.worldHeight - 120, this.player.y));
  }

  private updateNpcs(dt: number) {
    let closestNpc: NPC | null = null;
    let closestDist = 78; // Interaction radius in px

    for (const npc of this.npcs) {
      if (npc.speechTimer > 0) {
        npc.speechTimer -= dt;
      }
      if (npc.cooldownTimer > 0) {
        npc.cooldownTimer -= dt;
        if (npc.cooldownTimer <= 0) {
          npc.state = 'idle';
        }
      }

      // Fleeing logic
      if (npc.state === 'fleeing') {
        npc.x += npc.vx * dt;
        npc.walkFrame += dt * 10;
        if (npc.x <= 60 || npc.x >= this.level.worldWidth - 60) {
          npc.vx = -npc.vx;
          npc.facing = npc.vx > 0 ? 'right' : 'left';
        }
      } else if (npc.type === 'PEDESTRIAN' || npc.type === 'BUSINESSMAN') {
        // Gentle patrol walking along pavement
        npc.x += npc.vx * dt;
        npc.walkFrame += dt * 4;
        if (npc.x >= npc.patrolMaxX) {
          npc.vx = -Math.abs(npc.vx);
          npc.facing = 'left';
        } else if (npc.x <= npc.patrolMinX) {
          npc.vx = Math.abs(npc.vx);
          npc.facing = 'right';
        }
      }

      // Check distance to player
      const dist = Math.hypot(npc.x - this.player.x, npc.y - this.player.y);
      if (dist < closestDist && npc.cooldownTimer <= 0 && npc.state !== 'fleeing') {
        closestDist = dist;
        closestNpc = npc;
      }
    }

    this.nearestNpc = closestNpc;
  }

  private updatePursuers(dt: number) {
    this.nearestPursuer = null;
    this.nearestPursuerDistance = 9999;

    for (let i = this.pursuers.length - 1; i >= 0; i--) {
      const p = this.pursuers[i];
      if (p.speechTimer > 0) p.speechTimer -= dt;

      const dx = this.player.x - p.x;
      const dy = this.player.y - p.y;
      const dist = Math.hypot(dx, dy);

      // Track nearest for HUD radar
      if (dist < this.nearestPursuerDistance) {
        this.nearestPursuerDistance = dist;
        this.nearestPursuer = p;
        this.nearestPursuerAngle = Math.atan2(dy, dx);
      }

      // Catch condition!
      if (dist <= 36) {
        this.isGameOver = true;
        this.player.isCaught = true;
        soundManager.playCaught();
        this.showBanner('❌ আপনি ধরা পড়ে গেছেন!');
        return;
      }

      // Chase AI
      if (p.state === 'chasing') {
        // If player has escaped far away (> 680px) and risk cooled below 50%
        if (dist > 680 && this.riskMeter < 50) {
          p.state = 'leaving';
          p.searchTimer = 4.0;
        } else {
          // Approach player
          const dirX = dx / dist;
          const dirY = dy / dist;
          p.facing = dirX > 0 ? 'right' : 'left';
          p.walkFrame += dt * 10;

          const stepX = p.x + dirX * p.speed * dt;
          const stepY = p.y + dirY * p.speed * dt;

          if (!this.checkColliderCollision(stepX, p.y, p.width, p.height)) {
            p.x = stepX;
          }
          if (!this.checkColliderCollision(p.x, stepY, p.width, p.height)) {
            p.y = stepY;
          }
        }
      } else if (p.state === 'leaving') {
        p.searchTimer -= dt;
        // Move towards map edge
        p.x += (p.x > this.level.worldWidth / 2 ? 1 : -1) * p.speed * 0.8 * dt;
        if (p.searchTimer <= 0 || p.x < 50 || p.x > this.level.worldWidth - 50) {
          this.pursuers.splice(i, 1);
        }
      }
    }
  }

  private updateVehicles(dt: number) {
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i];
      v.x += v.vx * dt;

      // Slight pedestrian knock/swerve
      if (Math.hypot(this.player.x - v.x, this.player.y - v.y) < 35) {
        this.player.x += (v.vx > 0 ? 1 : -1) * 30 * dt;
      }

      if (v.x < -150 || v.x > this.level.worldWidth + 150) {
        this.vehicles.splice(i, 1);
      }
    }
  }

  private updatePowerUps() {
    for (const p of this.powerUps) {
      if (p.collected) continue;
      const dist = Math.hypot(this.player.x - p.x, this.player.y - p.y);
      if (dist < 36) {
        p.collected = true;
        this.activateSpeedBoost();
        this.addFloatingText('স্পিড বুস্ট!', p.x, p.y - 30, '#38bdf8');
      }
    }
  }

  private updateEffects(dt: number) {
    // Floating text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 38 * dt;
      ft.lifetime -= dt * 1.1;
      if (ft.lifetime <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.lifetime -= dt;
      if (p.lifetime <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private checkDynamicSpawns(dt: number) {
    // Vehicles spawn periodically
    this.vehicleSpawnTimer += dt;
    if (this.vehicleSpawnTimer > (this.level.levelNumber === 2 ? 3.5 : 5.5)) {
      this.vehicleSpawnTimer = 0;
      if (this.vehicles.length < (this.level.levelNumber === 2 ? 4 : 2)) {
        this.spawnVehicle();
      }
    }

    // Pursuer spawn trigger based on risk
    if (this.riskMeter >= 75 && this.pursuers.length < (this.level.levelNumber === 2 ? 3 : 2)) {
      if (Math.random() < this.level.pursuerSpawnChance) {
        this.spawnPursuer();
      }
    }
  }

  private checkColliderCollision(x: number, y: number, w: number, h: number): boolean {
    const halfW = w / 2;
    const halfH = h / 2;
    const pLeft = x - halfW;
    const pRight = x + halfW;
    const pTop = y - halfH;
    const pBottom = y + halfH;

    for (const col of this.colliders) {
      const cLeft = col.x;
      const cRight = col.x + col.width;
      const cTop = col.y;
      const cBottom = col.y + col.height;

      if (pRight > cLeft && pLeft < cRight && pBottom > cTop && pTop < cBottom) {
        return true;
      }
    }
    return false;
  }

  private addFloatingText(text: string, x: number, y: number, color: string, amount?: number) {
    this.floatingTexts.push({
      id: `ft_${Date.now()}_${Math.random()}`,
      text,
      x,
      y,
      color,
      lifetime: 1.0,
      amount,
    });
  }

  private createBurstParticles(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 4,
        lifetime: 0.6 + Math.random() * 0.4,
        maxLifetime: 1.0,
      });
    }
  }
}
