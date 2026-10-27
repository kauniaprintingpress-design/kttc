export type GameState =
  | 'START'
  | 'RULES'
  | 'PLAYING'
  | 'PAUSED'
  | 'CAUGHT'
  | 'LEVEL_COMPLETE'
  | 'GAME_COMPLETE';

export type NpcType =
  | 'SHOPKEEPER'   // দোকানদার (+৳100)
  | 'PEDESTRIAN'   // পথচারী (+৳50)
  | 'BUSINESSMAN'  // ব্যবসায়ী (+৳200)
  | 'REFUSER'      // প্রতিবাদী (না ভাই পারব না!)
  | 'VIP_BONUS';   // বিশেষ চান্দা (+৳500)

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  vx: number;
  vy: number;
}

export interface RectCollider {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 'left' | 'right' | 'up' | 'down';
  width: number;
  height: number;
  speed: number;
  isSprinting: boolean;
  isEvading: boolean;
  evadeCooldown: number; // in seconds
  boostActive: boolean;
  boostTimeRemaining: number;
  boostCooldown: number;
  walkFrame: number;
  isCaught: boolean;
  caughtAnimationTimer: number;
}

export interface NPC {
  id: string;
  name: string;
  type: NpcType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 'left' | 'right';
  width: number;
  height: number;
  chandaValue: number;
  dialogueSuccess: string;
  dialogueRefuse: string;
  state: 'idle' | 'walking' | 'collected' | 'fleeing';
  cooldownTimer: number;
  patrolMinX: number;
  patrolMaxX: number;
  walkFrame: number;
  speechText?: string;
  speechTimer: number;
}

export interface Pursuer {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 'left' | 'right';
  width: number;
  height: number;
  speed: number;
  state: 'chasing' | 'searching' | 'leaving';
  searchTimer: number;
  speechText?: string;
  speechTimer: number;
  walkFrame: number;
}

export interface Vehicle {
  id: string;
  type: 'bicycle' | 'motorcycle' | 'cng_auto';
  x: number;
  y: number;
  vx: number;
  direction: 'left' | 'right';
  width: number;
  height: number;
  label: string;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  lifetime: number; // 0 to 1
  amount?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  lifetime: number;
  maxLifetime: number;
}

export interface PowerUpItem {
  id: string;
  type: 'speed_chai' | 'money_bag';
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
}

export interface LevelConfig {
  levelNumber: number;
  name: string;
  targetChanda: number;
  backgroundImageUrl: string;
  worldWidth: number;
  worldHeight: number;
  npcCount: number;
  pursuerSpeed: number;
  pursuerSpawnChance: number;
  description: string;
}
