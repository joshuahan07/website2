// Background music player

let audio: HTMLAudioElement | null = null;
let isPlaying = false;
let currentTheme: string | null = null;
let pendingTheme: string | null = null;
let userInteracted = false;

// Try local files first (dev), then Google Drive (deployed)
const TRACKS: Record<string, string[]> = {
  kingdom: [
    '/audio/kingdom.mp3',
    'https://drive.usercontent.google.com/download?id=1S-Qzv1x4YNoJ-A-VXtR4CdanHSdGZRrM&export=download',
  ],
  pirate: [
    '/audio/pirate.mp3',
    'https://drive.usercontent.google.com/download?id=1YWyjCDn9sfJdlhBPfxQ3hlEHfK81UOTL&export=download',
  ],
  greek: [
    '/audio/greek.mp3',
    'https://drive.usercontent.google.com/download?id=1OMfe6oG1uNX-6U3FCg26yjvRFOvNMMBc&export=download',
  ],
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

function tryPlayUrl(urls: string[], index: number, theme: string) {
  if (index >= urls.length) {
    isPlaying = false;
    currentTheme = null;
    return;
  }

  const el = new Audio();
  el.crossOrigin = 'anonymous';
  el.loop = true;
  el.volume = 0;
  el.preload = 'auto';
  el.src = urls[index];

  el.addEventListener('error', () => {
    // Try next URL
    tryPlayUrl(urls, index + 1, theme);
  });

  el.addEventListener('canplaythrough', () => {
    // Only proceed if we haven't been stopped
    if (currentTheme !== null && currentTheme !== theme) return;

    audio = el;
    el.play().then(() => {
      isPlaying = true;
      currentTheme = theme;
      pendingTheme = null;
      fadeIn(el);
    }).catch(() => {
      // Autoplay blocked - wait for interaction
      pendingTheme = theme;
      audio = el;
      isPlaying = false;
    });
  }, { once: true });
}

// Listen for first user interaction to unlock audio
if (typeof document !== 'undefined') {
  const unlock = () => {
    userInteracted = true;
    if (pendingTheme && audio && !isPlaying) {
      audio.play().then(() => {
        isPlaying = true;
        currentTheme = pendingTheme;
        pendingTheme = null;
        fadeIn(audio!);
      }).catch(() => {});
    }
    document.removeEventListener('click', unlock);
    document.removeEventListener('touchstart', unlock);
    document.removeEventListener('keydown', unlock);
  };
  document.addEventListener('click', unlock);
  document.addEventListener('touchstart', unlock);
  document.addEventListener('keydown', unlock);
}

export function startMusic(theme: 'kingdom' | 'pirate' | 'greek') {
  if (typeof window === 'undefined') return;
  if (isPlaying && currentTheme === theme) return;

  stopMusic();
  currentTheme = theme;

  const urls = TRACKS[theme];
  if (!urls) return;

  tryPlayUrl(urls, 0, theme);
}

export function stopMusic() {
  if (!audio) { isPlaying = false; currentTheme = null; return; }

  const fadingAudio = audio;
  let vol = fadingAudio.volume;
  audio = null;
  isPlaying = false;
  currentTheme = null;
  pendingTheme = null;

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
