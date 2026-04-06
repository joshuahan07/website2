// Background music player using HTML5 Audio

let audio: HTMLAudioElement | null = null;
let isPlaying = false;
let currentTheme: string | null = null;

const TRACKS: Record<string, string> = {
  kingdom: '/audio/kingdom.mp3',
  pirate: '/audio/pirate.mp3',
  greek: '/audio/greek.mp3',
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
    // Audio file not available (deployed without audio files)
    isPlaying = false;
    currentTheme = null;
  });

  audio.play().then(() => {
    isPlaying = true;
    currentTheme = theme;
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
    // Autoplay blocked - will start on next user interaction
    isPlaying = false;
  });
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
