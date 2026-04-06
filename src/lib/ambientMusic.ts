// Background music player

let audio: HTMLAudioElement | null = null;
let isPlaying = false;
let currentTheme: string | null = null;
let pendingTheme: string | null = null;

const TRACKS: Record<string, string> = {
  kingdom: 'https://drive.usercontent.google.com/download?id=1S-Qzv1x4YNoJ-A-VXtR4CdanHSdGZRrM&export=download',
  pirate: 'https://drive.usercontent.google.com/download?id=1YWyjCDn9sfJdlhBPfxQ3hlEHfK81UOTL&export=download',
  greek: 'https://drive.usercontent.google.com/download?id=1OMfe6oG1uNX-6U3FCg26yjvRFOvNMMBc&export=download',
};

function fadeIn(el: HTMLAudioElement, target = 0.25) {
  let vol = 0;
  el.volume = 0;
  const interval = setInterval(() => {
    vol += 0.01;
    if (vol >= target) { vol = target; clearInterval(interval); }
    try { el.volume = vol; } catch { clearInterval(interval); }
  }, 50);
}

export function startMusic(theme: 'kingdom' | 'pirate' | 'greek') {
  if (typeof window === 'undefined') return;
  if (isPlaying && currentTheme === theme) return;

  stopMusic();

  const url = TRACKS[theme];
  if (!url) return;

  const el = new Audio();
  // Don't set crossOrigin - let browser handle it natively
  el.loop = true;
  el.volume = 0;
  el.preload = 'auto';
  el.src = url;
  audio = el;
  currentTheme = theme;

  el.addEventListener('error', () => {
    console.log('Music failed to load for', theme);
    isPlaying = false;
    currentTheme = null;
  });

  const doPlay = () => {
    el.play().then(() => {
      isPlaying = true;
      pendingTheme = null;
      fadeIn(el);
    }).catch(() => {
      // Autoplay blocked - set pending
      pendingTheme = theme;
      isPlaying = false;
    });
  };

  // Try playing immediately, or when enough data is buffered
  if (el.readyState >= 2) {
    doPlay();
  } else {
    el.addEventListener('canplay', doPlay, { once: true });
  }
}

export function stopMusic() {
  pendingTheme = null;
  if (!audio) { isPlaying = false; currentTheme = null; return; }

  const fadingAudio = audio;
  let vol = fadingAudio.volume;
  audio = null;
  isPlaying = false;
  currentTheme = null;

  if (vol <= 0) { fadingAudio.pause(); fadingAudio.src = ''; return; }

  const fadeOut = setInterval(() => {
    vol -= 0.02;
    if (vol <= 0) {
      fadingAudio.pause();
      fadingAudio.src = '';
      clearInterval(fadeOut);
    }
    try { fadingAudio.volume = Math.max(0, vol); } catch { clearInterval(fadeOut); }
  }, 50);
}

export function setMusicVolume(vol: number) {
  if (audio) audio.volume = Math.max(0, Math.min(1, vol));
}

export function isMusicPlaying() {
  return isPlaying;
}

// Retry pending music on user interaction
export function retryPendingMusic() {
  if (pendingTheme && audio && !isPlaying) {
    audio.play().then(() => {
      isPlaying = true;
      currentTheme = pendingTheme;
      pendingTheme = null;
      fadeIn(audio!);
    }).catch(() => {});
  }
}

// Set up global interaction listener
if (typeof document !== 'undefined') {
  const handler = () => {
    retryPendingMusic();
  };
  document.addEventListener('click', handler);
  document.addEventListener('touchstart', handler);
}
