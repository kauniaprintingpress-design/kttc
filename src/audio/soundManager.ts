/**
 * Self-contained Web Audio API Procedural Sound Engine
 * No external audio files required - 100% reliable, zero network latency
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private lastStepTime = 0;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;

  constructor() {
    // Read user preference
    const stored = localStorage.getItem('chanda_bhai_muted');
    if (stored !== null) {
      this.muted = stored === 'true';
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    localStorage.setItem('chanda_bhai_muted', String(muted));
    if (muted) {
      this.stopSiren();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // Cha-ching / Coin collection sound
  public playChandaCollect(amount: number) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';

    // Scale pitch based on amount
    const baseFreq = amount >= 500 ? 880 : amount >= 200 ? 740 : amount >= 100 ? 587 : 523;

    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 0.18);

    osc2.frequency.setValueAtTime(baseFreq * 1.25, now + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, now + 0.22);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.03);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  // Refusal sound ("না ভাই, পারব না!")
  public playRefuse() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.25);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Risk warning beep
  public playRiskWarning() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(987, now); // B5 note
    osc.frequency.setValueAtTime(1318, now + 0.06); // E6

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  // Whistle / Pursuer Alert
  public playPursuerAlert() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Referee / Police whistle effect
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2200, now);
    osc.frequency.linearRampToValueAtTime(2600, now + 0.08);
    osc.frequency.linearRampToValueAtTime(2100, now + 0.16);
    osc.frequency.linearRampToValueAtTime(2700, now + 0.24);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Continuous / Periodic Siren when being actively chased
  public startSiren() {
    if (this.muted || this.sirenOsc) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, now);
    
    // Low frequency modulation for siren wail
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(2.5, now); // 2.5 Hz wail

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(250, now);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    lfo.start(now);

    this.sirenOsc = osc;
    this.sirenGain = gain;
  }

  public stopSiren() {
    if (this.sirenOsc && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.sirenGain?.gain.linearRampToValueAtTime(0.001, now + 0.1);
        this.sirenOsc.stop(now + 0.12);
      } catch {
        // Safe catch
      }
      this.sirenOsc = null;
      this.sirenGain = null;
    }
  }

  // Evade dash swoosh
  public playEvade() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Speed boost activation
  public playBoost() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.35);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Caught / Failure sound
  public playCaught() {
    this.stopSiren();
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [329.63, 311.13, 293.66, 277.18]; // E4, Eb4, D4, C#4

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startTime = now + idx * 0.18;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.29);
    });
  }

  // Win / Victory Fanfare
  public playWin() {
    this.stopSiren();
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // C major triumph: C4, E4, G4, C5, E5
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25];

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startTime = now + idx * 0.12;
      const duration = idx === notes.length - 1 ? 0.8 : 0.25;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.01, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  // Footstep throttle
  public playStep() {
    if (this.muted) return;
    const now = Date.now();
    if (now - this.lastStepTime < 240) return;
    this.lastStepTime = now;

    this.initCtx();
    if (!this.ctx) return;

    const audioNow = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, audioNow);
    osc.frequency.exponentialRampToValueAtTime(60, audioNow + 0.04);

    gain.gain.setValueAtTime(0.05, audioNow);
    gain.gain.exponentialRampToValueAtTime(0.001, audioNow + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(audioNow);
    osc.stop(audioNow + 0.05);
  }
}

export const soundManager = new SoundManager();
