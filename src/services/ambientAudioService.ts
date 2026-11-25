// ambientAudioService.ts - Zero-bandwidth Web Audio API Spatial Study Soundscapes

export type AmbientSoundscapeMode = "off" | "rain" | "focus" | "alpha";

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];
  private currentMode: AmbientSoundscapeMode = "off";
  private currentVolume = 0.22;

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    if (!this.ctx) {
      this.ctx = new Ctx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.0001;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private stopNodes() {
    for (const node of this.activeNodes) {
      try {
        if ("stop" in node && typeof (node as any).stop === "function") {
          (node as any).stop();
        }
        node.disconnect();
      } catch {
        // ignore already stopped nodes
      }
    }
    this.activeNodes = [];
  }

  private createNoiseBuffer(ctx: AudioContext, seconds = 4, color: "pink" | "brown"): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const output = buffer.getChannelData(ch);
      if (color === "brown") {
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 2.8;
        }
      } else {
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.09;
          b6 = white * 0.115926;
        }
      }
    }
    return buffer;
  }

  public setMode(mode: AmbientSoundscapeMode) {
    this.currentMode = mode;
    if (mode === "off") {
      if (this.ctx && this.masterGain) {
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setTargetAtTime(0.0001, now, 0.15);
      }
      setTimeout(() => {
        if (this.currentMode === "off") {
          this.stopNodes();
        }
      }, 450);
      return;
    }

    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    this.stopNodes();

    if (mode === "rain") {
      const source = ctx.createBufferSource();
      source.buffer = this.createNoiseBuffer(ctx, 4, "pink");
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 900;
      filter.Q.value = 0.45;

      const softLow = ctx.createBiquadFilter();
      softLow.type = "lowpass";
      softLow.frequency.value = 2600;

      source.connect(filter);
      filter.connect(softLow);
      softLow.connect(this.masterGain);
      source.start();
      this.activeNodes.push(source, filter, softLow);
    } else if (mode === "focus") {
      const source = ctx.createBufferSource();
      source.buffer = this.createNoiseBuffer(ctx, 4, "brown");
      source.loop = true;

      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 420;

      source.connect(lp);
      lp.connect(this.masterGain);
      source.start();
      this.activeNodes.push(source, lp);
    } else if (mode === "alpha") {
      // Subtle stereo binaural 10Hz Alpha-wave focus drone (200Hz L / 210Hz R)
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      const panL = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const panR = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const toneGain = ctx.createGain();
      toneGain.gain.value = 0.22;

      oscL.type = "sine";
      oscR.type = "sine";
      oscL.frequency.value = 200;
      oscR.frequency.value = 210;

      if (panL && panR) {
        panL.pan.value = -0.85;
        panR.pan.value = 0.85;
        oscL.connect(panL);
        panL.connect(toneGain);
        oscR.connect(panR);
        panR.connect(toneGain);
        this.activeNodes.push(panL, panR);
      } else {
        oscL.connect(toneGain);
        oscR.connect(toneGain);
      }

      toneGain.connect(this.masterGain);
      oscL.start();
      oscR.start();
      this.activeNodes.push(oscL, oscR, toneGain);
    }

    const now = ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(this.currentVolume * 0.45, now, 0.25);
  }

  public setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain && this.currentMode !== "off") {
      this.masterGain.gain.setTargetAtTime(this.currentVolume * 0.45, this.ctx.currentTime, 0.1);
    }
  }
}

export const ambientAudioEngine = new AmbientAudioEngine();
