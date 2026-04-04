'use client';

import { useTheme } from '@/lib/ThemeContext';
import { THEME_LIST, ThemeId } from '@/lib/themes';

export default function ThemeToggle() {
  const { themeId, setThemeId } = useTheme();

  return (
    <div className="flex items-center gap-0.5 bg-stone-800/80 rounded-lg p-0.5 border border-stone-700/50">
      {THEME_LIST.map(t => (
        <button
          key={t.id}
          onClick={() => setThemeId(t.id as ThemeId)}
          className={`
            px-2 py-1 rounded-md text-xs font-medium transition-all duration-200
            ${themeId === t.id
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-700/50'
            }
          `}
          title={t.name}
        >
          <span className="mr-1">{t.icon}</span>
          <span className="hidden sm:inline">{t.name}</span>
        </button>
      ))}
    </div>
  );
}
