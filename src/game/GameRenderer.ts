import { GameWorld } from './GameWorld';
import { NPC, Pursuer, Vehicle, PowerUpItem } from '../types/game';

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private bgImage: HTMLImageElement | null = null;
  private bgLoaded: boolean = false;
  private currentBgUrl: string = '';

  public cameraX: number = 0;
  public cameraY: number = 0;
  public shakeDuration: number = 0;
  public shakeIntensity: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;
  }

  public setBackgroundImage(url: string) {
    if (this.currentBgUrl === url && this.bgLoaded) return;
    this.currentBgUrl = url;
    this.bgLoaded = false;
    const img = new Image();
    img.src = url;
    img.onload = () => {
      this.bgImage = img;
      this.bgLoaded = true;
    };
  }

  public triggerShake(intensity: number = 6, duration: number = 0.25) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  public render(world: GameWorld, dt: number) {
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    // Handle screen shake
    let shakeOffsetX = 0;
    let shakeOffsetY = 0;
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
    }

    // Camera follow player smoothly
    const targetCamX = world.player.x - width / 2;
    const targetCamY = world.player.y - height / 2;

    const maxCamX = Math.max(0, world.level.worldWidth - width);
    const maxCamY = Math.max(0, world.level.worldHeight - height);

    this.cameraX += (Math.max(0, Math.min(maxCamX, targetCamX)) - this.cameraX) * 0.12;
    this.cameraY += (Math.max(0, Math.min(maxCamY, targetCamY)) - this.cameraY) * 0.12;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Apply camera transform
    ctx.translate(-Math.round(this.cameraX) + shakeOffsetX, -Math.round(this.cameraY) + shakeOffsetY);

    // 1. Draw Road and Environment Base
    this.renderEnvironment(world);

    // 2. Draw Road Markings & Zebra Crossings
    this.renderRoadDetails(world);

    // 3. Draw PowerUps
    this.renderPowerUps(world.powerUps);

    // 4. Draw Vehicles (Bicycles, CNGs)
    this.renderVehicles(world.vehicles);

    // 5. Draw NPCs
    this.renderNpcs(world.npcs, world);

    // 6. Draw Pursuers
    this.renderPursuers(world.pursuers);

    // 7. Draw Player ("চান্দা ভাই")
    this.renderPlayer(world.player, world);

    // 8. Draw Utility Poles & Hanging Overhead Wires
    this.renderUtilityPolesAndWires(world);

    // 9. Draw Particle Bursts
    this.renderParticles(world);

    // 10. Draw Floating Numbers
    this.renderFloatingTexts(world);

    ctx.restore();

    // 11. Render Screen-space UI Overlays (Pursuer Indicators, Danger flashes)
    this.renderScreenSpaceAlerts(world);
  }

  private renderEnvironment(world: GameWorld) {
    const ctx = this.ctx;
    const w = world.level.worldWidth;
    const h = world.level.worldHeight;

    // Base dirt/shoulder ground
    ctx.fillStyle = '#c7a77d';
    ctx.fillRect(0, 0, w, h);

    // North shopfront backdrop strip (repeat-stitched photograph)
    if (this.bgLoaded && this.bgImage) {
      const bgW = 900;
      const bgH = 240;
      for (let bx = 0; bx < w; bx += bgW) {
        ctx.drawImage(this.bgImage, 0, 0, this.bgImage.width, this.bgImage.height * 0.65, bx, 40, bgW, bgH);
      }
    } else {
      // Styled fallback shopfront pattern
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(0, 40, w, 240);
    }

    // Asphalt Main Road (center)
    const roadY = 320;
    const roadH = h - 640;
    ctx.fillStyle = '#374151'; // Dark asphalt
    ctx.fillRect(0, roadY, w, roadH);

    // Road curb / dirt shoulder borders
    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, roadY - 8, w, 8);
    ctx.fillRect(0, roadY + roadH, w, 8);

    // South shopfront strip
    if (this.bgLoaded && this.bgImage) {
      const bgW = 900;
      const bgH = 220;
      for (let bx = 0; bx < w; bx += bgW) {
        ctx.drawImage(this.bgImage, 0, this.bgImage.height * 0.35, this.bgImage.width, this.bgImage.height * 0.65, bx, h - 260, bgW, bgH);
      }
    }

    // Roadside Shops & Stalls
    for (const col of world.colliders) {
      if (col.label && col.label !== 'North Boundary' && col.label !== 'South Boundary' && col.label !== 'West Boundary' && col.label !== 'East Boundary') {
        if (col.label === 'বিদ্যুৎ খুঁটি' || col.label === 'গাছ' || col.label === 'কলা গাছ') {
          continue; // Handled specially
        }

        // Shop stall canopy
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(col.x, col.y, col.width, col.height);

        // Corrugated tin roof awning
        ctx.fillStyle = '#475569';
        ctx.fillRect(col.x - 6, col.y + col.height - 35, col.width + 12, 35);

        // Shop signboard in Bengali
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(col.x + 8, col.y + col.height - 30, col.width - 16, 22);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 12px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(col.label, col.x + col.width / 2, col.y + col.height - 19);
      }
    }
  }

  private renderRoadDetails(world: GameWorld) {
    const ctx = this.ctx;
    const w = world.level.worldWidth;
    const h = world.level.worldHeight;
    const roadCenterY = h / 2;

    // Center dashed white road divider
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 4;
    ctx.setLineDash([25, 20]);
    ctx.beginPath();
    ctx.moveTo(0, roadCenterY);
    ctx.lineTo(w, roadCenterY);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Zebra Crossings at regular intervals
    for (let zx = 450; zx < w; zx += 800) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      for (let s = 0; s < 7; s++) {
        ctx.fillRect(zx, roadCenterY - 100 + s * 30, 48, 16);
      }
    }

    // Potholes and road dirt patches for authentic small-town feel
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    for (let px = 200; px < w; px += 350) {
      ctx.beginPath();
      ctx.ellipse(px + 70, roadCenterY + 45, 18, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderPowerUps(powerUps: PowerUpItem[]) {
    const ctx = this.ctx;
    for (const p of powerUps) {
      if (p.collected) continue;

      // Glow circle
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 22, 0, Math.PI * 2);
      ctx.fill();

      // Tea Cup / Chai icon
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#b45309';
      ctx.fillRect(p.x - 7, p.y - 8, 14, 16);

      // Steam wisps
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x - 3, p.y - 12);
      ctx.lineTo(p.x, p.y - 18);
      ctx.moveTo(p.x + 3, p.y - 12);
      ctx.lineTo(p.x + 5, p.y - 18);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 10px "Hind Siliguri", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('চা বুস্ট!', p.x, p.y + 24);
    }
  }

  private renderVehicles(vehicles: Vehicle[]) {
    const ctx = this.ctx;
    for (const v of vehicles) {
      ctx.save();
      ctx.translate(v.x, v.y);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, 14, v.width / 2, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      if (v.type === 'cng_auto') {
        // Green Bangladeshi CNG auto-rickshaw
        ctx.fillStyle = '#15803d'; // Green
        ctx.fillRect(-v.width / 2, -18, v.width, 28);

        // Front window & grille
        ctx.fillStyle = '#38bdf8';
        const winX = v.direction === 'right' ? v.width / 2 - 16 : -v.width / 2 + 4;
        ctx.fillRect(winX, -14, 12, 10);

        // Headlight beam
        ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
        ctx.beginPath();
        if (v.direction === 'right') {
          ctx.moveTo(v.width / 2, -4);
          ctx.lineTo(v.width / 2 + 50, -18);
          ctx.lineTo(v.width / 2 + 50, 12);
        } else {
          ctx.moveTo(-v.width / 2, -4);
          ctx.lineTo(-v.width / 2 - 50, -18);
          ctx.lineTo(-v.width / 2 - 50, 12);
        }
        ctx.closePath();
        ctx.fill();

        // Wheels
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-v.width / 2 + 6, 8, 12, 5);
        ctx.fillRect(v.width / 2 - 18, 8, 12, 5);
      } else if (v.type === 'motorcycle') {
        // Motorcycle
        ctx.fillStyle = '#dc2626'; // Red bike
        ctx.fillRect(-16, -6, 32, 10);
        ctx.fillStyle = '#0284c7'; // Rider shirt
        ctx.beginPath();
        ctx.arc(-2, -14, 7, 0, Math.PI * 2);
        ctx.fill();

        // Wheels
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(-14, 6, 6, 0, Math.PI * 2);
        ctx.arc(14, 6, 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Bicycle
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-12, 4, 7, 0, Math.PI * 2);
        ctx.arc(12, 4, 7, 0, Math.PI * 2);
        ctx.moveTo(-12, 4);
        ctx.lineTo(0, -4);
        ctx.lineTo(12, 4);
        ctx.stroke();

        // Rider in lungi
        ctx.fillStyle = '#059669';
        ctx.fillRect(-4, -8, 8, 12);
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.arc(0, -14, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderNpcs(npcs: NPC[], world: GameWorld) {
    const ctx = this.ctx;

    for (const npc of npcs) {
      ctx.save();
      ctx.translate(npc.x, npc.y);

      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.beginPath();
      ctx.ellipse(0, 18, 15, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // If collected, slight dim
      if (npc.state === 'collected') {
        ctx.globalAlpha = 0.65;
      }

      // NPC Body & Clothing based on type
      const legBob = Math.sin(npc.walkFrame) * 4;

      if (npc.type === 'SHOPKEEPER') {
        // Lungi + White vest / shirt
        ctx.fillStyle = '#0284c7'; // Blue checked lungi
        ctx.fillRect(-8, 2, 16, 16 + legBob * 0.3);
        ctx.fillStyle = '#f8fafc'; // White shirt
        ctx.fillRect(-9, -12, 18, 14);
        // Head
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.arc(0, -18, 7, 0, Math.PI * 2);
        ctx.fill();
        // White prayer cap (tupi) or towel
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-6, -24, 12, 5);
      } else if (npc.type === 'BUSINESSMAN') {
        // Formal Panjabi / Suit with briefcase
        ctx.fillStyle = '#334155'; // Dark formal pants
        ctx.fillRect(-8, 4, 16, 14 + legBob * 0.3);
        ctx.fillStyle = '#e2e8f0'; // Silk panjabi
        ctx.fillRect(-10, -12, 20, 16);
        // Head
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(0, -19, 7, 0, Math.PI * 2);
        ctx.fill();
        // Briefcase
        ctx.fillStyle = '#78350f';
        ctx.fillRect(npc.facing === 'right' ? 8 : -14, -4, 8, 10);
      } else if (npc.type === 'VIP_BONUS') {
        // VIP with golden glow aura
        ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
        ctx.beginPath();
        ctx.arc(0, -6, 26, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#b45309';
        ctx.fillRect(-8, 4, 16, 14);
        ctx.fillStyle = '#fbbf24'; // Golden embroidered kurta
        ctx.fillRect(-10, -13, 20, 17);
        // Head
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.arc(0, -20, 8, 0, Math.PI * 2);
        ctx.fill();
        // Star badge above
        ctx.fillStyle = '#fbbf24';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⭐', 0, -32);
      } else {
        // Pedestrian / Refuser
        const lungiColor = npc.type === 'REFUSER' ? '#dc2626' : '#059669';
        ctx.fillStyle = lungiColor;
        ctx.fillRect(-8, 3, 16, 15 + legBob * 0.3);
        ctx.fillStyle = '#fbbf24'; // Yellow shirt
        ctx.fillRect(-9, -11, 18, 14);
        // Head
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.arc(0, -18, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // If Fleeing (Refuser): comic sweat drops & exclamation
      if (npc.state === 'fleeing') {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('❗', 0, -30);
      }

      ctx.restore();

      // Proximity Action Prompt if player is near
      if (world.nearestNpc?.id === npc.id && npc.state !== 'fleeing' && npc.cooldownTimer <= 0) {
        ctx.save();
        ctx.translate(npc.x, npc.y - 42);

        // Pulsing Gold Prompt Box
        const pulse = Math.sin(Date.now() * 0.008) * 2;
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(-45, -14 + pulse, 90, 24, 6);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 12px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`[E] চান্দা ৳${npc.chandaValue}`, 0, -2 + pulse);

        ctx.restore();
      }

      // Speech bubble if speaking
      if (npc.speechTimer > 0 && npc.speechText) {
        this.renderSpeechBubble(npc.x, npc.y - 50, npc.speechText);
      }
    }
  }

  private renderPursuers(pursuers: Pursuer[]) {
    const ctx = this.ctx;

    for (const p of pursuers) {
      ctx.save();
      ctx.translate(p.x, p.y);

      // Warning siren pulse ring under pursuer
      const pulseRing = (Date.now() % 800) / 800;
      ctx.strokeStyle = `rgba(239, 68, 68, ${1 - pulseRing})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 10, 16 + pulseRing * 24, 0, Math.PI * 2);
      ctx.stroke();

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 18, 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body (Navy law enforcement uniform)
      const legBob = Math.sin(p.walkFrame) * 6;
      ctx.fillStyle = '#0f172a'; // Dark navy pants
      ctx.fillRect(-7, 2, 6, 16 + legBob);
      ctx.fillRect(1, 2, 6, 16 - legBob);

      ctx.fillStyle = '#1e3a8a'; // Blue uniform shirt
      ctx.fillRect(-10, -14, 20, 16);

      // Peaked Cap
      ctx.fillStyle = '#172554';
      ctx.fillRect(-9, -26, 18, 6);
      ctx.fillStyle = '#f59e0b'; // Gold badge on cap
      ctx.fillRect(-3, -26, 6, 4);

      // Head
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(0, -18, 7, 0, Math.PI * 2);
      ctx.fill();

      // Baton in hand
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.facing === 'right' ? 8 : -8, -6);
      ctx.lineTo(p.facing === 'right' ? 18 : -18, -14);
      ctx.stroke();

      // Whistle cord
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(-2, -10, 4, 3);

      ctx.restore();

      // Speech bubble
      if (p.speechTimer > 0 && p.speechText) {
        this.renderSpeechBubble(p.x, p.y - 54, p.speechText, '#ef4444');
      }
    }
  }

  private renderPlayer(player: GameWorld['player'], world: GameWorld) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(player.x, player.y);

    // Evasion / Boost Speed Ghost Trails
    if (player.boostActive || player.isEvading) {
      ctx.fillStyle = player.boostActive ? 'rgba(245, 158, 11, 0.35)' : 'rgba(56, 189, 248, 0.4)';
      ctx.beginPath();
      ctx.ellipse(player.facing === 'left' ? 18 : -18, 0, 18, 24, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.ellipse(0, 20, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Swagger Walk / Sprint animation cycle
    const walkBob = Math.sin(player.walkFrame) * (player.isSprinting ? 6 : 4);
    const armSwing = Math.cos(player.walkFrame) * (player.isSprinting ? 8 : 5);

    // Blue Denim Rolled Jeans
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(-8, 2, 7, 18 + walkBob);
    ctx.fillRect(1, 2, 7, 18 - walkBob);

    // Sneakers
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-9, 20 + walkBob, 8, 5);
    ctx.fillRect(1, 20 - walkBob, 8, 5);

    // Colorful Bangladeshi patterned shirt (Chanda Bhai's signature look)
    ctx.fillStyle = '#ea580c'; // Vibrant orange printed shirt
    ctx.fillRect(-12, -15, 24, 18);

    // Shirt pattern accents
    ctx.fillStyle = '#fde047';
    ctx.fillRect(-8, -11, 4, 4);
    ctx.fillRect(4, -11, 4, 4);
    ctx.fillRect(-2, -6, 4, 4);

    // Arms with confident swagger
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-15, -12 + armSwing, 4, 14);
    ctx.fillRect(11, -12 - armSwing, 4, 14);

    // Head
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(0, -22, 9, 0, Math.PI * 2);
    ctx.fill();

    // Signature Sunglasses
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(player.facing === 'left' ? -9 : -4, -25, 12, 5);
    // Tint highlight
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(player.facing === 'left' ? -7 : -2, -24, 3, 2);

    // Mustache
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-4, -18, 8, 2.5);

    // If caught: spinning comic stars
    if (player.isCaught) {
      const starAngle = player.caughtAnimationTimer * 5;
      ctx.fillStyle = '#fbbf24';
      ctx.font = '14px sans-serif';
      ctx.fillText('💫', Math.cos(starAngle) * 16, -38 + Math.sin(starAngle) * 6);
      ctx.fillText('⭐', Math.cos(starAngle + Math.PI) * 16, -38 + Math.sin(starAngle + Math.PI) * 6);
    }

    ctx.restore();

    // Floating Name Label above player: "চান্দা ভাই"
    ctx.save();
    ctx.translate(player.x, player.y - 42);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-36, -11, 72, 20, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('চান্দা ভাই', 0, 0);

    ctx.restore();
  }

  private renderUtilityPolesAndWires(world: GameWorld) {
    const ctx = this.ctx;
    const poles: { x: number; y: number }[] = [];

    for (const col of world.colliders) {
      if (col.label === 'বিদ্যুৎ খুঁটি') {
        poles.push({ x: col.x + col.width / 2, y: col.y });

        // Draw tall concrete electric utility pole
        ctx.fillStyle = '#64748b';
        ctx.fillRect(col.x, col.y - 90, col.width, 90 + col.height);

        // Crossbeam near top
        ctx.fillStyle = '#475569';
        ctx.fillRect(col.x - 16, col.y - 82, col.width + 32, 7);

        // Porcelain insulators
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(col.x - 14, col.y - 86, 4, 4);
        ctx.fillRect(col.x + col.width + 10, col.y - 86, 4, 4);
      } else if (col.label === 'গাছ' || col.label === 'কলা গাছ') {
        // Roadside Tree
        ctx.fillStyle = '#78350f'; // Trunk
        ctx.fillRect(col.x + 10, col.y - 30, 12, 35);

        // Green leafy canopy
        ctx.fillStyle = col.label === 'কলা গাছ' ? '#84cc16' : '#15803d';
        ctx.beginPath();
        ctx.arc(col.x + 16, col.y - 45, 26, 0, Math.PI * 2);
        ctx.arc(col.x + 6, col.y - 50, 20, 0, Math.PI * 2);
        ctx.arc(col.x + 26, col.y - 50, 20, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Connect poles with hanging catenary black wires (iconic Bangladeshi town hallmark)
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.lineWidth = 1.2;

    for (let i = 0; i < poles.length - 1; i++) {
      const p1 = poles[i];
      const p2 = poles[i + 1];

      // Only connect adjacent poles within realistic distance
      if (Math.abs(p1.x - p2.x) < 500) {
        // Wire 1
        ctx.beginPath();
        ctx.moveTo(p1.x - 12, p1.y - 84);
        ctx.quadraticCurveTo((p1.x + p2.x) / 2, (p1.y + p2.y) / 2 - 65, p2.x - 12, p2.y - 84);
        ctx.stroke();

        // Wire 2
        ctx.beginPath();
        ctx.moveTo(p1.x + 12, p1.y - 84);
        ctx.quadraticCurveTo((p1.x + p2.x) / 2, (p1.y + p2.y) / 2 - 58, p2.x + 12, p2.y - 84);
        ctx.stroke();
      }
    }
  }

  private renderSpeechBubble(x: number, y: number, text: string, borderColor = '#f59e0b') {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = 'bold 12px "Hind Siliguri", sans-serif';
    const textMetrics = ctx.measureText(text);
    const boxW = Math.max(70, textMetrics.width + 20);
    const boxH = 26;

    ctx.translate(x, y);

    // Bubble body
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-boxW / 2, -boxH, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    // Pointer tail
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(0, 6);
    ctx.lineTo(4, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Text
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, -boxH / 2);

    ctx.restore();
  }

  private renderParticles(world: GameWorld) {
    const ctx = this.ctx;
    for (const p of world.particles) {
      const alpha = Math.max(0, p.lifetime / p.maxLifetime);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  private renderFloatingTexts(world: GameWorld) {
    const ctx = this.ctx;
    for (const ft of world.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.lifetime);
      ctx.translate(ft.x, ft.y);

      ctx.font = 'bold 15px "Hind Siliguri", "Outfit", sans-serif';
      ctx.textAlign = 'center';

      // Outline
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, 0, 0);

      // Fill
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, 0, 0);

      ctx.restore();
    }
  }

  // Draw offscreen Pursuer Indicator (points to nearest pursuer around screen perimeter)
  private renderScreenSpaceAlerts(world: GameWorld) {
    const ctx = this.ctx;
    const { width, height } = this.canvas;

    if (world.nearestPursuer && world.nearestPursuerDistance > 120 && world.nearestPursuer.state === 'chasing') {
      const p = world.nearestPursuer;
      const screenPX = p.x - this.cameraX;
      const screenPY = p.y - this.cameraY;

      // Check if pursuer is offscreen or close to edge
      const isOffscreen = screenPX < 30 || screenPX > width - 30 || screenPY < 30 || screenPY > height - 30;

      if (isOffscreen) {
        // Clamp indicator to edge
        const margin = 40;
        const centerX = width / 2;
        const centerY = height / 2;
        const angle = Math.atan2(screenPY - centerY, screenPX - centerX);

        const edgeX = Math.max(margin, Math.min(width - margin, centerX + Math.cos(angle) * (width / 2 - margin)));
        const edgeY = Math.max(margin, Math.min(height - margin, centerY + Math.sin(angle) * (height / 2 - margin)));

        ctx.save();
        ctx.translate(edgeX, edgeY);
        ctx.rotate(angle);

        // Red alert pointer chevron
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(-8, -10);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-8, 10);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Distance text
        const meters = Math.round(world.nearestPursuerDistance / 25);
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 11px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`🚨 ${meters}মি`, edgeX, edgeY + 20);
      }
    }
  }
}
