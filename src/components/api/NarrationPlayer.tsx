'use client';

import {
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useRef,
} from 'react';
import { ThemeId } from '@/lib/themes';
import { GameEventType, EventDetails } from '@/types/api';
import { getNarration } from '@/lib/apis/speechSynthesis';
import useSpeechSynthesis from '@/hooks/useSpeechSynthesis';

export interface NarrationPlayerHandle {
  narrate: (event: GameEventType, details?: EventDetails) => void;
}

interface NarrationPlayerProps {
  theme: ThemeId;
}

const NarrationPlayer = forwardRef<NarrationPlayerHandle, NarrationPlayerProps>(
  function NarrationPlayer({ theme }, ref) {
    const { speak, isSpeaking, isMuted, toggleMute } = useSpeechSynthesis();
    const [text, setText] = useState('');
    const [visible, setVisible] = useState(false);
    const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const supported =
      typeof window !== 'undefined' && 'speechSynthesis' in window;

    const clearFadeTimer = useCallback(() => {
      if (fadeTimerRef.current !== null) {
        clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    }, []);

    // Clean up timer on unmount
    useEffect(() => {
      return () => clearFadeTimer();
    }, [clearFadeTimer]);

    // When speech ends, start fade-out timer
    useEffect(() => {
      if (!isSpeaking && text) {
        clearFadeTimer();
        fadeTimerRef.current = setTimeout(() => {
          setVisible(false);
        }, 2000);
      }
    }, [isSpeaking, text, clearFadeTimer]);

    const narrate = useCallback(
      (event: GameEventType, details: EventDetails = {}) => {
        const narration = getNarration(theme, event, details);
        if (!narration) return;

        clearFadeTimer();
        setText(narration);
        setVisible(true);

        if (supported && !isMuted) {
          speak(narration);
        } else {
          // Text-only toast: fade out after 4s for readability
          fadeTimerRef.current = setTimeout(() => {
            setVisible(false);
          }, 4000);
        }
      },
      [theme, speak, isMuted, supported, clearFadeTimer],
    );

    useImperativeHandle(ref, () => ({ narrate }), [narrate]);

    return (
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
        {/* Mute toggle */}
        <button
          type="button"
          onClick={toggleMute}
          className="absolute -top-10 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
          aria-label={isMuted ? 'Unmute narration' : 'Mute narration'}
        >
          {isMuted ? (
            // Speaker muted icon
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            // Speaker icon
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <path d="M19.07 4.93a10 10 0 010 14.14" />
              <path d="M15.54 8.46a5 5 0 010 7.07" />
            </svg>
          )}
        </button>

        {/* Narration subtitle */}
        <div
          className={`max-w-md rounded-lg bg-black/75 px-6 py-3 text-center text-sm font-medium text-white shadow-lg backdrop-blur-sm transition-all duration-500 ${
            visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0 pointer-events-none'
          }`}
        >
          {text}
        </div>
      </div>
    );
  },
);

export default NarrationPlayer;
