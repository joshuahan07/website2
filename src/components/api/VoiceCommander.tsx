'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ThemeId } from '@/lib/themes';
import { GameCommand } from '@/types/api';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface VoiceCommanderProps {
  theme: ThemeId;
  onCommand: (command: GameCommand) => void;
}

function formatCommand(command: GameCommand): string {
  switch (command.type) {
    case 'move':
      if (command.piece && command.to) return `Moving ${command.piece} to ${command.to}`;
      if (command.from && command.to) return `Moving ${command.from} to ${command.to}`;
      return 'Move command';
    case 'attack':
      if (command.piece && command.to) return `${command.piece} attacking ${command.to}`;
      if (command.to) return `Attacking ${command.to}`;
      return 'Attack command';
    case 'predict':
      return `Predicting: ${command.prediction}`;
    case 'ready':
      return 'Ready!';
    case 'theme':
      return `Switching to ${command.theme} theme`;
    case 'cancel':
      return 'Cancelled';
    default:
      return 'Unknown command';
  }
}

function MicIcon({ isListening }: { isListening: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={isListening ? 'text-white' : 'text-stone-300'}
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

export default function VoiceCommander({ theme, onCommand }: VoiceCommanderProps) {
  const {
    startListening,
    stopListening,
    isListening,
    transcript,
    lastCommand,
    error,
  } = useSpeechRecognition(theme);

  const [isSupported, setIsSupported] = useState(true);
  const [pendingCommand, setPendingCommand] = useState<GameCommand | null>(null);
  const [pendingKey, setPendingKey] = useState(0);
  const [showDeniedToast, setShowDeniedToast] = useState(false);
  const [hasDismissedDenied, setHasDismissedDenied] = useState(false);

  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCommandRef = useRef<GameCommand | null>(null);

  // Check browser support on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as unknown as Record<string, unknown>;
    const supported = !!(w.SpeechRecognition ?? w.webkitSpeechRecognition);
    setIsSupported(supported);
  }, []);

  // Handle permission denied error
  useEffect(() => {
    if (error === 'Microphone access denied.' && !hasDismissedDenied) {
      setShowDeniedToast(true);
      const timer = setTimeout(() => {
        setShowDeniedToast(false);
        setHasDismissedDenied(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, hasDismissedDenied]);

  // Handle new commands from speech recognition
  useEffect(() => {
    if (!lastCommand) return;
    // Avoid re-processing the same command object
    if (lastCommand === prevCommandRef.current) return;
    prevCommandRef.current = lastCommand;

    // Cancel command is immediate
    if (lastCommand.type === 'cancel') {
      if (confirmTimerRef.current) {
        clearTimeout(confirmTimerRef.current);
        confirmTimerRef.current = null;
      }
      setPendingCommand(null);
      return;
    }

    // Set pending command with 2-second confirmation window
    setPendingCommand(lastCommand);
    setPendingKey((k) => k + 1);
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
    }
    confirmTimerRef.current = setTimeout(() => {
      onCommand(lastCommand);
      setPendingCommand(null);
      confirmTimerRef.current = null;
    }, 2000);
  }, [lastCommand, onCommand]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) {
        clearTimeout(confirmTimerRef.current);
      }
    };
  }, []);

  const handleToggle = useCallback(() => {
    if (isListening) {
      stopListening();
      setPendingCommand(null);
      if (confirmTimerRef.current) {
        clearTimeout(confirmTimerRef.current);
        confirmTimerRef.current = null;
      }
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleCancelCommand = useCallback(() => {
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
    setPendingCommand(null);
  }, []);

  // If not supported, show nothing (or tooltip on hover handled by parent)
  if (!isSupported) {
    return (
      <div className="fixed bottom-6 right-6 z-50 group">
        <div
          className="w-12 h-12 rounded-full bg-stone-800/60 border border-stone-700/50
                     flex items-center justify-center cursor-not-allowed opacity-50"
        >
          <MicIcon isListening={false} />
        </div>
        <div
          className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-stone-900 text-stone-300
                     text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100
                     transition-opacity pointer-events-none border border-stone-700/50"
        >
          Voice commands not supported in this browser
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Permission denied toast */}
      {showDeniedToast && (
        <div
          className="bg-stone-900/95 border border-amber-600/50 text-stone-200 text-sm
                     rounded-lg px-4 py-3 max-w-xs shadow-lg animate-in fade-in slide-in-from-bottom-2"
        >
          Microphone access denied. You can still play using click controls.
        </div>
      )}

      {/* Pending command confirmation */}
      {pendingCommand && (
        <div
          className="bg-stone-900/95 border border-stone-600/50 rounded-lg px-4 py-3
                     shadow-lg max-w-xs"
        >
          <p className="text-amber-400 text-sm font-medium">
            {formatCommand(pendingCommand)}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1 bg-stone-700 rounded-full overflow-hidden">
              <div
                key={pendingKey}
                className="h-full bg-amber-500 rounded-full transition-none"
                style={{
                  width: '0%',
                  animation: 'voice-cmd-shrink 2s linear forwards',
                }}
              />
            </div>
            <button
              onClick={handleCancelCommand}
              className="text-stone-400 hover:text-stone-200 text-xs px-2 py-1
                         rounded border border-stone-600/50 hover:border-stone-500/50
                         transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Live transcript */}
      {isListening && transcript && !pendingCommand && (
        <div
          className="bg-stone-900/90 border border-stone-700/50 rounded-lg px-3 py-2
                     max-w-xs shadow-lg"
        >
          <p className="text-stone-300 text-sm italic truncate">{transcript}</p>
        </div>
      )}

      {/* Mic toggle button */}
      <button
        onClick={handleToggle}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center
          transition-all duration-200 shadow-lg
          ${isListening
            ? 'bg-red-600 hover:bg-red-700 border-2 border-red-400/50 animate-pulse'
            : 'bg-stone-800 hover:bg-stone-700 border border-stone-600/50'
          }
        `}
        title={isListening ? 'Stop listening' : 'Start voice commands'}
      >
        <MicIcon isListening={isListening} />
      </button>
      <span className={`text-[9px] font-medium tracking-wide ${isListening ? 'text-red-400' : 'text-white/30'}`}>
        {isListening ? 'Listening...' : 'Voice Command'}
      </span>

    </div>
  );
}
