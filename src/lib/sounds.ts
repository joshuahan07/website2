// Web Audio API sound effects - no files needed
const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playNoise(duration: number, volume = 0.1) {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / bufferSize);
  }
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const gain = audioCtx.createGain();
  gain.gain.value = volume;
  source.connect(gain);
  gain.connect(audioCtx.destination);
  source.start();
}

export const SFX = {
  // Piece placed on board during setup
  place() {
    playTone(800, 0.08, 'sine', 0.1);
    setTimeout(() => playTone(1200, 0.06, 'sine', 0.08), 50);
  },

  // Piece selected / clicked
  select() {
    playTone(600, 0.1, 'sine', 0.08);
  },

  // Piece moved
  move() {
    playTone(400, 0.1, 'triangle', 0.08);
    setTimeout(() => playTone(500, 0.08, 'triangle', 0.06), 60);
  },

  // Combat clash
  combat() {
    playNoise(0.15, 0.12);
    playTone(200, 0.2, 'sawtooth', 0.1);
    setTimeout(() => playTone(150, 0.15, 'sawtooth', 0.08), 100);
  },

  // Piece captured / destroyed
  destroy() {
    playTone(300, 0.3, 'sawtooth', 0.08);
    setTimeout(() => playTone(200, 0.2, 'sawtooth', 0.06), 100);
    setTimeout(() => playTone(100, 0.3, 'sawtooth', 0.04), 200);
  },

  // Victory fanfare
  victory() {
    playTone(523, 0.2, 'triangle', 0.12); // C5
    setTimeout(() => playTone(659, 0.2, 'triangle', 0.12), 150); // E5
    setTimeout(() => playTone(784, 0.2, 'triangle', 0.12), 300); // G5
    setTimeout(() => playTone(1047, 0.4, 'triangle', 0.15), 450); // C6
  },

  // Defeat
  defeat() {
    playTone(400, 0.3, 'sine', 0.1);
    setTimeout(() => playTone(350, 0.3, 'sine', 0.08), 200);
    setTimeout(() => playTone(300, 0.3, 'sine', 0.06), 400);
    setTimeout(() => playTone(200, 0.5, 'sine', 0.05), 600);
  },

  // Your turn notification
  yourTurn() {
    playTone(880, 0.1, 'sine', 0.08);
    setTimeout(() => playTone(1100, 0.15, 'sine', 0.1), 100);
  },

  // Coin flip
  coinFlip() {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => playTone(800 + Math.random() * 400, 0.05, 'sine', 0.06), i * 80);
    }
  },

  // Ready button
  ready() {
    playTone(500, 0.1, 'triangle', 0.1);
    setTimeout(() => playTone(700, 0.1, 'triangle', 0.1), 100);
    setTimeout(() => playTone(900, 0.15, 'triangle', 0.12), 200);
  },

  // Error / invalid
  error() {
    playTone(200, 0.15, 'square', 0.08);
    setTimeout(() => playTone(180, 0.15, 'square', 0.06), 100);
  },
};
