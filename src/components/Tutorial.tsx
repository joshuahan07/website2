'use client';

import { useState } from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { getPieceCrop } from '@/lib/pieceCrops';

interface TutorialProps {
  onClose: () => void;
}

export default function Tutorial({ onClose }: TutorialProps) {
  const { theme } = useTheme();
  const [page, setPage] = useState(0);

  const n = (rank: string) => theme.pieceNames[rank as keyof typeof theme.pieceNames];
  const img = (rank: string) => theme.pieceImages[rank as keyof typeof theme.pieceImages];

  const PieceIcon = ({ rank, size = 'w-10 h-10' }: { rank: string; size?: string }) => {
    const src = img(rank);
    const crop = src ? getPieceCrop(theme.id, src) : null;
    return (
      <div className={`${size} rounded-full overflow-hidden ring-2 ring-blue-400/40 bg-stone-900 flex-shrink-0`}>
        {src ? (
          <img src={src} alt={n(rank)} className="w-full h-full object-cover"
            style={crop ? { transform: `scale(${crop.scale}) translate(${crop.offsetX}%, ${crop.offsetY}%)` } : undefined} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg">
            {theme.pieceEmojis[rank as keyof typeof theme.pieceEmojis]}
          </div>
        )}
      </div>
    );
  };

  const pages = [
    // Page 1: Basics
    {
      title: 'How to Play',
      content: (
        <div className="space-y-4">
          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
            <h4 className="text-sm font-bold text-blue-400 mb-2">Movement</h4>
            <p className="text-xs text-white/50">Pieces move <span className="text-white">one square</span> in any direction — up, down, left, or right. No diagonal moves.</p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
            <h4 className="text-sm font-bold text-red-400 mb-2">Combat</h4>
            <p className="text-xs text-white/50">Move into an enemy piece to attack. <span className="text-white">Higher rank wins</span> — the loser is removed. If both ranks are equal, <span className="text-white">both die</span>.</p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
            <h4 className="text-sm font-bold text-amber-400 mb-2">Win Condition</h4>
            <div className="flex items-center gap-3">
              <PieceIcon rank="F" />
              <p className="text-xs text-white/50">Capture the enemy&apos;s <span className="text-white">{n('F')}</span> 🏆 to win the game!</p>
            </div>
          </div>
        </div>
      ),
    },
    // Page 2: Special pieces
    {
      title: 'Special Pieces',
      content: (
        <div className="space-y-3">
          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-2">
              <PieceIcon rank="0" />
              <div>
                <h4 className="text-sm font-bold text-purple-400">{n('0')} (Spy)</h4>
                <p className="text-xs text-white/40">Rank 0 — weakest piece</p>
              </div>
            </div>
            <p className="text-xs text-white/50">The <span className="text-white">weakest piece</span> — dies to everything. But it has one trick: it can <span className="text-white">kill the {n('10')}</span> (rank 10) when <span className="text-white">attacking first</span>. (Must attack first)</p>
          </div>

          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-2">
              <PieceIcon rank="1" />
              <div>
                <h4 className="text-sm font-bold text-cyan-400">{n('1')} (Spotter)</h4>
                <p className="text-xs text-white/40">Rank 1</p>
              </div>
            </div>
            <p className="text-xs text-white/50">If this piece moves into an empty square and there is an enemy piece <span className="text-white">directly in front of it</span> after it moves, you get to <span className="text-white">guess its rank</span>. If your prediction is correct, the enemy piece is <span className="text-white">instantly destroyed</span> without combat.</p>
          </div>

          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-2">
              <PieceIcon rank="2" />
              <div>
                <h4 className="text-sm font-bold text-green-400">{n('2')} (Scout)</h4>
                <p className="text-xs text-white/40">Rank 2</p>
              </div>
            </div>
            <p className="text-xs text-white/50">Can move <span className="text-white">any number of squares</span> in a straight line (like a rook in chess).</p>
          </div>

          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-2">
              <PieceIcon rank="3" />
              <div>
                <h4 className="text-sm font-bold text-orange-400">{n('3')} (Miner)</h4>
                <p className="text-xs text-white/40">Rank 3</p>
              </div>
            </div>
            <p className="text-xs text-white/50">The only piece that can <span className="text-white">defuse {n('B')}s</span> 💥. All other pieces that attack a {n('B')} are destroyed.</p>
          </div>
        </div>
      ),
    },
    // Page 4: Immovables
    {
      title: 'Immovable Pieces',
      content: (
        <div className="space-y-4">
          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-2">
              <PieceIcon rank="F" />
              <div>
                <h4 className="text-sm font-bold text-amber-400">{n('F')} 🏆</h4>
                <p className="text-xs text-white/40">Cannot move — hide it well!</p>
              </div>
            </div>
            <p className="text-xs text-white/50">Your most important piece. <span className="text-white">If captured, you lose.</span> Place it behind your strongest defenses. You have <span className="text-white">1</span>.</p>
          </div>

          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-2">
              <PieceIcon rank="B" />
              <div>
                <h4 className="text-sm font-bold text-red-400">{n('B')} 💥</h4>
                <p className="text-xs text-white/40">Cannot move — use as traps</p>
              </div>
            </div>
            <p className="text-xs text-white/50"><span className="text-white">Destroys any piece</span> that attacks it — except the {n('3')} (Miner). Place them around your {n('F')} for protection. You have <span className="text-white">5</span>.</p>
          </div>

          <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 mt-4">
            <h4 className="text-sm font-bold text-amber-400 mb-1">💡 Pro Tip</h4>
            <p className="text-xs text-white/50">Surround your {n('F')} with {n('B')}s, but keep at least one {n('3')} alive to defuse enemy {n('B')}s!</p>
          </div>
        </div>
      ),
    },
  ];

  const currentPage = pages[page];
  const isLast = page === pages.length - 1;

  return (
    <div className="fixed left-0 right-0 bottom-0 flex items-center justify-center z-[45]" style={{ top: '44px' }}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative max-w-lg w-full mx-4 rounded-3xl overflow-hidden border border-blue-500/20 shadow-2xl shadow-blue-500/10">
        <div className="absolute inset-0 bg-[#0a0d14]/95 backdrop-blur-xl" />
        <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />

        <div className="relative p-6 max-h-[70vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-white">{currentPage.title}</h2>
            <div className="flex items-center gap-2">
              {pages.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === page ? 'bg-blue-400 scale-125' : 'bg-white/20'}`} />
              ))}
            </div>
          </div>

          {/* Content */}
          {currentPage.content}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {page > 0 && (
              <button
                onClick={() => setPage(page - 1)}
                className="flex-1 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white/60 hover:bg-white/[0.08] hover:text-white font-semibold text-sm transition-all"
              >
                ← Back
              </button>
            )}
            <button
              onClick={() => isLast ? onClose() : setPage(page + 1)}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm transition-all hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.99]"
            >
              {isLast ? 'Start Playing →' : 'Next →'}
            </button>
          </div>

          {/* Skip */}
          {!isLast && (
            <button
              onClick={onClose}
              className="w-full mt-2 py-2 text-white/20 hover:text-white/40 text-xs transition-colors"
            >
              Skip tutorial
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
