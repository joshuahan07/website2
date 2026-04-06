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
  isMuted: boolean;
  toggleMute: () => void;
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

    // When speech ends, hide subtitle immediately
    useEffect(() => {
      if (!isSpeaking && text) {
        clearFadeTimer();
        fadeTimerRef.current = setTimeout(() => {
          setVisible(false);
        }, 300);
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

    useImperativeHandle(ref, () => ({ narrate, isMuted, toggleMute }), [narrate, isMuted, toggleMute]);

    return (
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 pointer-events-none">
        {/* Narration subtitle only - mute button moved to top bar */}
        <div
          className={`max-w-md rounded-lg bg-black/75 px-6 py-3 text-center text-sm font-medium text-white shadow-lg backdrop-blur-sm transition-all duration-500 ${
            visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}
        >
          {text}
        </div>
      </div>
    );
  },
);

export default NarrationPlayer;
