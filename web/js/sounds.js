/** Underwater Web Audio SFX — procedural, no asset files. Call Sounds.unlock() on user gesture. */
const Sounds = (function () {
  let ctx = null;
  let masterGain = null;
  let underwaterFilter = null;
  let ambTimer = null;
  let ambActive = false;
  let unlocked = false;

  function ac() {
    if (!ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      ctx = new Ctx();
    }
    return ctx;
  }

  function ensureBus() {
    const c = ac();
    if (!c) return null;
    if (!masterGain) {
      masterGain = c.createGain();
      masterGain.gain.value = 1.05;
      underwaterFilter = c.createBiquadFilter();
      underwaterFilter.type = 'lowpass';
      underwaterFilter.frequency.value = 2800;
      underwaterFilter.Q.value = 0.65;
      masterGain.connect(underwaterFilter);
      underwaterFilter.connect(c.destination);
    }
    return c;
  }

  function dest() {
    ensureBus();
    return masterGain;
  }

  function primeSilentBuffer(c) {
    const t = c.currentTime;
    const buffer = c.createBuffer(1, 1, c.sampleRate);
    buffer.getChannelData(0)[0] = 0;
    const src = c.createBufferSource();
    src.buffer = buffer;
    const gain = c.createGain();
    gain.gain.value = 0.0001;
    src.connect(gain);
    gain.connect(dest());
    src.start(t);
    src.stop(t + 0.01);

    const osc = c.createOscillator();
    const og = c.createGain();
    og.gain.value = 0.0001;
    osc.connect(og);
    og.connect(dest());
    osc.start(t);
    osc.stop(t + 0.01);
  }

  function ensureReady() {
    const c = ensureBus();
    if (!c) return false;
    if (c.state === 'suspended') {
      try {
        c.resume();
      } catch {
        return false;
      }
    }
    return c.state === 'running' || c.state === 'interrupted';
  }

  function unlock() {
    const c = ensureBus();
    if (!c) return Promise.resolve(false);

    primeSilentBuffer(c);

    const done = c.state === 'suspended'
      ? c.resume().catch(() => {})
      : Promise.resolve();

    return done.then(() => {
      if (c.state === 'running') unlocked = true;
      return c.state === 'running';
    });
  }

  function playTone(freq, duration, type, volume, when, detune = 0) {
    if (!ensureReady()) return;
    const c = ac();
    if (!c) return;
    const t0 = when ?? c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (detune) osc.detune.setValueAtTime(detune, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), t0 + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(dest());
    osc.start(t0);
    osc.stop(t0 + duration + 0.06);
  }

  function playNoise(duration, volume, when, filterHz) {
    if (!ensureReady()) return;
    const c = ac();
    if (!c) return;
    const t0 = when ?? c.currentTime;
    const bufferSize = Math.max(1, Math.floor(c.sampleRate * duration));
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = c.createBufferSource();
    const gain = c.createGain();
    src.buffer = buffer;
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    src.connect(gain);
    if (filterHz) {
      const f = c.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = filterHz;
      f.Q.value = 1.2;
      gain.connect(f);
      f.connect(dest());
    } else {
      gain.connect(dest());
    }
    src.start(t0);
  }

  function playBubble(when, volume = 0.05, pitch = 520) {
    if (!ensureReady()) return;
    const c = ac();
    if (!c) return;
    const t0 = when ?? c.currentTime;
    playNoise(0.045, volume * 0.55, t0, 900 + Math.random() * 400);
    playTone(pitch, 0.05, 'sine', volume * 0.75, t0 + 0.008, (Math.random() - 0.5) * 80);
  }

  function playBubbleTrail(count, start, spacing, baseVol) {
    for (let i = 0; i < count; i++) {
      playBubble(start + i * spacing, baseVol * (0.7 + Math.random() * 0.35), 440 + i * 35);
    }
  }

  function scheduleAmbienceBubble() {
    if (!ambActive) return;
    playBubble(undefined, 0.018 + Math.random() * 0.018, 380 + Math.random() * 220);
    ambTimer = setTimeout(scheduleAmbienceBubble, 1600 + Math.random() * 2400);
  }

  return {
    unlock,
    isUnlocked: () => unlocked,

    resetDive() {},

    startAmbience() {
      if (ambActive) return;
      ambActive = true;
      scheduleAmbienceBubble();
    },

    stopAmbience() {
      ambActive = false;
      if (ambTimer) {
        clearTimeout(ambTimer);
        ambTimer = null;
      }
    },

    diveStart() {
      const c = ac();
      if (!c || !ensureReady()) return;
      const t = c.currentTime;
      playNoise(0.22, 0.065, t, 400);
      playTone(220, 0.18, 'sine', 0.065, t);
      playTone(165, 0.28, 'sine', 0.045, t + 0.08);
      playBubbleTrail(4, t + 0.12, 0.07, 0.04);
    },

    photo() {
      const c = ac();
      if (!c || !ensureReady()) return;
      const t = c.currentTime;
      playNoise(0.025, 0.05, t, 1800);
      playTone(740, 0.04, 'square', 0.045, t);
      playTone(980, 0.06, 'sine', 0.038, t + 0.03);
      playBubble(t + 0.05, 0.03, 660);
    },

    dash() {
      const c = ac();
      if (!c || !ensureReady()) return;
      const t = c.currentTime;
      playNoise(0.1, 0.07, t, 900);
      playTone(180, 0.08, 'sine', 0.05, t);
      playTone(120, 0.12, 'sine', 0.038, t + 0.04);
      playBubbleTrail(4, t + 0.02, 0.05, 0.03);
    },

    newSpecies() {
      const c = ac();
      if (!c || !ensureReady()) return;
      const t = c.currentTime;
      playTone(392, 0.11, 'sine', 0.08, t);
      playTone(494, 0.11, 'sine', 0.075, t + 0.1);
      playTone(587, 0.13, 'sine', 0.065, t + 0.2);
      playTone(740, 0.16, 'sine', 0.055, t + 0.32);
      playBubbleTrail(3, t + 0.15, 0.09, 0.035);
    },

    cardReveal() {
      const c = ac();
      if (!c || !ensureReady()) return;
      const t = c.currentTime;
      playNoise(0.12, 0.03, t, 600);
      playTone(330, 0.14, 'sine', 0.05, t);
      playTone(440, 0.18, 'sine', 0.045, t + 0.1);
      playBubble(t + 0.06, 0.025, 520);
    },

    surface() {
      const c = ac();
      if (!c || !ensureReady()) return;
      const t = c.currentTime;
      playNoise(0.16, 0.055, t, 350);
      playTone(392, 0.14, 'sine', 0.065, t + 0.05);
      playTone(494, 0.18, 'sine', 0.055, t + 0.16);
      playBubbleTrail(5, t + 0.08, 0.06, 0.032);
    },

    albumArchive() {
      const c = ac();
      if (!c || !ensureReady()) return;
      const t = c.currentTime;
      playTone(523, 0.08, 'triangle', 0.048, t);
      playTone(659, 0.1, 'triangle', 0.042, t + 0.08);
      playBubble(t + 0.04, 0.022, 580);
    },

    stageBottle() {
      const c = ac();
      if (!c || !ensureReady()) return;
      const t = c.currentTime;
      playNoise(0.14, 0.045, t, 500);
      playTone(280, 0.12, 'sine', 0.05, t);
      playBubbleTrail(6, t + 0.04, 0.05, 0.036);
    },

    lowAir() {
      const c = ac();
      if (!c || !ensureReady()) return;
      const t = c.currentTime;
      playTone(92, 0.22, 'sine', 0.085, t);
      playTone(92, 0.22, 'sine', 0.065, t + 0.38);
      playNoise(0.08, 0.03, t + 0.1, 200);
    },

    criticalAir() {
      const c = ac();
      if (!c || !ensureReady()) return;
      const t = c.currentTime;
      playTone(110, 0.14, 'square', 0.065, t);
      playTone(110, 0.14, 'square', 0.06, t + 0.22);
      playTone(110, 0.14, 'square', 0.055, t + 0.44);
      playBubble(t + 0.05, 0.025, 300);
    },

    netTangle() {
      const c = ac();
      if (!c || !ensureReady()) return;
      const t = c.currentTime;
      playTone(160, 0.22, 'sawtooth', 0.08, t);
      playNoise(0.16, 0.05, t, 320);
    },

    netEscape() {
      const c = ac();
      if (!c || !ensureReady()) return;
      const t = c.currentTime;
      playTone(280, 0.09, 'triangle', 0.075, t);
      playTone(420, 0.12, 'triangle', 0.058, t + 0.08);
      playBubble(t + 0.04, 0.03, 500);
    },

    hit() {
      const c = ac();
      if (!c || !ensureReady()) return;
      const t = c.currentTime;
      playTone(95, 0.16, 'square', 0.1, t);
      playNoise(0.1, 0.07, t, 280);
    },

    coral() {
      const c = ac();
      if (!c || !ensureReady()) return;
      const t = c.currentTime;
      playNoise(0.08, 0.048, t, 420);
      playTone(140, 0.1, 'triangle', 0.052, t);
    },

    tankUpgrade() {
      const c = ac();
      if (!c || !ensureReady()) return;
      const t = c.currentTime;
      playTone(330, 0.12, 'sine', 0.075, t);
      playTone(440, 0.12, 'sine', 0.07, t + 0.12);
      playTone(554, 0.14, 'sine', 0.065, t + 0.24);
      playTone(659, 0.18, 'sine', 0.055, t + 0.36);
      playBubbleTrail(4, t + 0.2, 0.08, 0.032);
    },

    explosion() {
      const c = ac();
      if (!c || !ensureReady()) return;
      const t = c.currentTime;
      playNoise(0.32, 0.14, t, 180);
      playTone(70, 0.28, 'sawtooth', 0.1, t);
      playTone(45, 0.38, 'square', 0.07, t + 0.06);
    },

    gameOver(reason) {
      const c = ac();
      if (!c || !ensureReady()) return;
      const t = c.currentTime;
      if (reason === 'air') {
        playNoise(0.35, 0.06, t, 250);
        playTone(80, 0.35, 'sine', 0.07, t);
        playBubbleTrail(8, t + 0.1, 0.07, 0.026);
      } else if (reason === 'obstacle') {
        playNoise(0.2, 0.09, t, 200);
        playTone(60, 0.3, 'sawtooth', 0.09, t);
      } else {
        playTone(262, 0.12, 'sine', 0.048, t);
        playTone(330, 0.14, 'sine', 0.042, t + 0.12);
      }
    },
  };
})();
