// Background music player using HTML5 Audio

let audio: HTMLAudioElement | null = null;
let isPlaying = false;
let currentTheme: string | null = null;
let pendingTheme: string | null = null;

const TRACKS: Record<string, string> = {
  kingdom: 'https://drive.google.com/uc?export=download&id=1S-Qzv1x4YNoJ-A-VXtR4CdanHSdGZRrM',
  pirate: 'https://drive.google.com/uc?export=download&id=1YWyjCDn9sfJdlhBPfxQ3hlEHfK81UOTL',
  greek: 'https://drive.google.com/uc?export=download&id=1OMfe6oG1uNX-6U3FCg26yjvRFOvNMMBc',
};

export function startMusic(theme: 'kingdom' | 'pirate' | 'greek') {
  if (typeof window === 'undefined') return;

  // If same theme is already playing, don't restart
  if (isPlaying && currentTheme === theme) return;

  stopMusic();

  audio = new Audio(TRACKS[theme]);
  audio.loop = true;
  audio.volume = 0;

  // Fade in
  audio.addEventListener('error', () => {
    isPlaying = false;
    currentTheme = null;
  });

  const tryPlay = () => {
    if (!audio) return;
    audio.play().then(() => {
      isPlaying = true;
      currentTheme = theme;
      pendingTheme = null;
      let vol = 0;
      const fadeIn = setInterval(() => {
        vol += 0.02;
        if (vol >= 0.3) {
          vol = 0.3;
          clearInterval(fadeIn);
        }
        if (audio) audio.volume = vol;
      }, 50);
    }).catch(() => {
      // Autoplay blocked - retry on next user interaction
      pendingTheme = theme;
      isPlaying = false;
    });
  };

  tryPlay();

  // If autoplay was blocked, retry on any click/touch
  if (!isPlaying && typeof document !== 'undefined') {
    const retryOnInteraction = () => {
      if (pendingTheme && !isPlaying) {
        startMusic(pendingTheme as 'kingdom' | 'pirate' | 'greek');
      }
      document.removeEventListener('click', retryOnInteraction);
      document.removeEventListener('touchstart', retryOnInteraction);
    };
    document.addEventListener('click', retryOnInteraction, { once: true });
    document.addEventListener('touchstart', retryOnInteraction, { once: true });
  }
}

export function stopMusic() {
  if (!audio) return;

  const fadingAudio = audio;
  let vol = fadingAudio.volume;

  // Fade out
  const fadeOut = setInterval(() => {
    vol -= 0.03;
    if (vol <= 0) {
      vol = 0;
      fadingAudio.pause();
      fadingAudio.src = '';
      clearInterval(fadeOut);
    }
    try { fadingAudio.volume = vol; } catch {}
  }, 50);

  audio = null;
  isPlaying = false;
  currentTheme = null;
}

export function setMusicVolume(vol: number) {
  if (audio) audio.volume = Math.max(0, Math.min(1, vol));
}

export function isMusicPlaying() {
  return isPlaying;
}
