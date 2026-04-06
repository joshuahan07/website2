// Ambient background music using Web Audio API - no files needed
// Creates theme-specific drone/pad sounds

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isPlaying = false;
let oscillators: OscillatorNode[] = [];
let gains: GainNode[] = [];

function getCtx() {
  if (!audioCtx && typeof window !== 'undefined') {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(audioCtx.destination);
  }
  return { ctx: audioCtx!, master: masterGain! };
}

function createPad(freq: number, type: OscillatorType, vol: number, detune = 0) {
  const { ctx, master } = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  gain.gain.value = vol;
  osc.connect(gain);
  gain.connect(master);
  osc.start();
  oscillators.push(osc);
  gains.push(gain);
  return { osc, gain };
}

// Slow LFO to modulate volume for movement
function createLFO(target: AudioParam, rate: number, amount: number) {
  const { ctx } = getCtx();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = rate;
  lfoGain.gain.value = amount;
  lfo.connect(lfoGain);
  lfoGain.connect(target);
  lfo.start();
  oscillators.push(lfo);
}

const THEMES = {
  kingdom: () => {
    // Medieval: low strings drone in D minor
    createPad(73.42, 'sawtooth', 0.03, -5);   // D2
    createPad(73.42, 'sawtooth', 0.03, 5);    // D2 detuned (chorus)
    createPad(110, 'triangle', 0.025);          // A2
    createPad(146.83, 'sine', 0.02);            // D3
    const p = createPad(220, 'sine', 0.015);    // A3 (fifth)
    createLFO(p.gain.gain, 0.08, 0.008);        // Slow volume swell
  },
  pirate: () => {
    // Ocean: deeper, more mysterious, sea shanty feel
    createPad(65.41, 'sawtooth', 0.025, -8);   // C2
    createPad(65.41, 'sawtooth', 0.025, 8);    // C2 chorus
    createPad(98, 'triangle', 0.02);             // G2
    createPad(130.81, 'sine', 0.018);            // C3
    const p = createPad(196, 'sine', 0.012);     // G3
    createLFO(p.gain.gain, 0.05, 0.006);         // Very slow swell (like waves)
  },
  greek: () => {
    // Olympian: ethereal, mystical, open fifths
    createPad(82.41, 'sine', 0.03);              // E2
    createPad(123.47, 'triangle', 0.025);        // B2
    createPad(164.81, 'sine', 0.02, 3);          // E3
    createPad(246.94, 'sine', 0.015);             // B3
    const p = createPad(329.63, 'sine', 0.01);   // E4 (high shimmer)
    createLFO(p.gain.gain, 0.12, 0.005);
  },
};

export function startMusic(theme: 'kingdom' | 'pirate' | 'greek') {
  if (isPlaying) stopMusic();

  const { master } = getCtx();
  if (audioCtx?.state === 'suspended') audioCtx.resume();

  THEMES[theme]();
  isPlaying = true;

  // Fade in over 3 seconds
  master.gain.setValueAtTime(0, audioCtx!.currentTime);
  master.gain.linearRampToValueAtTime(1, audioCtx!.currentTime + 3);
}

export function stopMusic() {
  if (!isPlaying || !masterGain || !audioCtx) return;

  // Fade out over 1 second
  masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);

  setTimeout(() => {
    oscillators.forEach(o => { try { o.stop(); } catch {} });
    oscillators = [];
    gains = [];
    isPlaying = false;
  }, 1200);
}

export function setMusicVolume(vol: number) {
  if (!masterGain || !audioCtx) return;
  masterGain.gain.setValueAtTime(vol, audioCtx.currentTime);
}

export function isMusicPlaying() {
  return isPlaying;
}
