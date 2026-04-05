'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { SpeechOptions, UseSpeechSynthesisReturn } from '@/types/api';

function isSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Find the best male voice available
function getMaleVoice(): SpeechSynthesisVoice | null {
  if (!isSupported()) return null;
  const voices = window.speechSynthesis.getVoices();

  // Preferred male voices in order (deep, dramatic sounding)
  const preferred = [
    'Daniel',           // macOS British male - deep & clear
    'Aaron',            // macOS US male
    'James',            // Premium male
    'Google UK English Male',
    'Microsoft David',  // Windows male
    'Microsoft Mark',
    'Google US English',
    'Alex',             // macOS male
    'Fred',             // macOS male
    'Thomas',           // macOS French male
  ];

  // Try preferred voices first
  for (const name of preferred) {
    const voice = voices.find(v => v.name.includes(name));
    if (voice) return voice;
  }

  // Fallback: find any English male voice
  const englishMale = voices.find(v =>
    v.lang.startsWith('en') &&
    (v.name.toLowerCase().includes('male') ||
     v.name.includes('Daniel') ||
     v.name.includes('David') ||
     v.name.includes('James') ||
     v.name.includes('Mark'))
  );
  if (englishMale) return englishMale;

  // Fallback: any English voice
  const english = voices.find(v => v.lang.startsWith('en'));
  if (english) return english;

  return voices[0] || null;
}

export default function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Load voices (they load async in some browsers)
  useEffect(() => {
    if (!isSupported()) return;

    const loadVoices = () => {
      voiceRef.current = getMaleVoice();
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback(
    (text: string, options?: SpeechOptions) => {
      if (!isSupported() || isMuted) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.rate ?? 0.9;     // Slightly slower for dramatic effect
      utterance.pitch = options?.pitch ?? 0.85;   // Lower pitch for deeper male voice
      utterance.volume = options?.volume ?? 1;

      // Use the found male voice, or a provided override
      if (options?.voice) {
        utterance.voice = options.voice;
      } else if (voiceRef.current) {
        utterance.voice = voiceRef.current;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isMuted],
  );

  const stop = useCallback(() => {
    if (!isSupported()) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      if (!prev && isSupported()) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      return !prev;
    });
  }, []);

  return { speak, stop, isSpeaking, isMuted, toggleMute };
}
