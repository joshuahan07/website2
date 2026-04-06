'use client';

import { useTheme } from '@/lib/ThemeContext';

export default function LoadingScreen() {
  const { theme } = useTheme();

  const themeEmoji = theme.id === 'kingdom' ? '⚔️' : theme.id === 'pirate' ? '⚓' : '⚡';

  return (
    <div className="min-h-screen bg-[#050608] flex items-center justify-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[300px] h-[300px] rounded-full bg-blue-500/[0.06] blur-[80px] animate-pulse" />
      </div>

      <div className="relative z-10 text-center">
        {/* Spinning icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-700/20 border border-blue-500/20 flex items-center justify-center relative">
          <span className="text-3xl">{themeEmoji}</span>
          {/* Rotating ring */}
          <div className="absolute -inset-2 rounded-3xl border-2 border-transparent border-t-blue-400/40 animate-spin" style={{ animationDuration: '2s' }} />
        </div>

        <h2 className="text-2xl font-black text-white mb-2 tracking-wide">
          <span className="text-white">OUTRANK</span>
        </h2>
        <p className="text-white/30 text-sm animate-pulse">Loading {theme.name} battlefield...</p>
      </div>
    </div>
  );
}
