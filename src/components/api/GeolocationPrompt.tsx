'use client';

interface GeolocationPromptProps {
  onAllow: () => void;
  onDeny: () => void;
}

export default function GeolocationPrompt({ onAllow, onDeny }: GeolocationPromptProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 max-w-sm rounded-xl border border-stone-700/50 bg-stone-900 p-6 shadow-2xl">
        <div className="mb-4 text-center text-3xl">
          <span role="img" aria-label="globe">🌍</span>
        </div>

        <h2 className="mb-2 text-center text-lg font-semibold text-stone-100">
          Share your location?
        </h2>

        <p className="mb-6 text-center text-sm text-stone-400">
          See where your opponent is battling from on a live map.
          Your exact location is never shared — only an approximate position.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onDeny}
            className="flex-1 rounded-lg border border-stone-600 bg-stone-800 px-4 py-2.5 text-sm font-medium text-stone-300 transition-colors hover:bg-stone-700"
          >
            No thanks
          </button>
          <button
            onClick={onAllow}
            className="flex-1 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-500"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}
