import { PieceDefinition, Rank, Piece, PlayerNumber } from '@/types/game';

export const PIECE_DEFINITIONS: PieceDefinition[] = [
  { rank: 'F',  name: 'Flag',       quantity: 1, movable: false, moveRange: 0 },
  { rank: 'B',  name: 'Bomb',       quantity: 5, movable: false, moveRange: 0 },
  { rank: '0',  name: 'Spy',        quantity: 1, movable: true,  moveRange: 1 },
  { rank: '1',  name: 'Spotter',    quantity: 2, movable: true,  moveRange: 1 },
  { rank: '2',  name: 'Scout',      quantity: 5, movable: true,  moveRange: Infinity },
  { rank: '3',  name: 'Miner',      quantity: 5, movable: true,  moveRange: 1 },
  { rank: '4',  name: 'Sergeant',   quantity: 2, movable: true,  moveRange: 1 },
  { rank: '5',  name: 'Lieutenant', quantity: 2, movable: true,  moveRange: 1 },
  { rank: '6',  name: 'Captain',    quantity: 2, movable: true,  moveRange: 1 },
  { rank: '7',  name: 'Major',      quantity: 2, movable: true,  moveRange: 1 },
  { rank: '8',  name: 'Colonel',    quantity: 1, movable: true,  moveRange: 1 },
  { rank: '9',  name: 'General',    quantity: 1, movable: true,  moveRange: 1 },
  { rank: '10', name: 'Marshal',    quantity: 1, movable: true,  moveRange: 1 },
];

export const TOTAL_PIECES = 30;

export function getPieceDefinition(rank: Rank): PieceDefinition {
  return PIECE_DEFINITIONS.find(p => p.rank === rank)!;
}

export function getRankValue(rank: Rank): number {
  if (rank === 'F') return -2;
  if (rank === 'B') return -1;
  return parseInt(rank);
}

export function generatePieceSet(owner: PlayerNumber): Piece[] {
  const pieces: Piece[] = [];
  let idCounter = 0;

  for (const def of PIECE_DEFINITIONS) {
    for (let i = 0; i < def.quantity; i++) {
      pieces.push({
        id: `p${owner}-${def.rank}-${idCounter++}`,
        rank: def.rank,
        name: def.name,
        owner,
      });
    }
  }

  return pieces;
}

export const RANK_DISPLAY: Record<Rank, { symbol: string; color: string }> = {
  'F':  { symbol: '🏆', color: '#fbbf24' }, // yellow
  'B':  { symbol: '💥', color: '#ef4444' }, // red
  '0':  { symbol: 'S',  color: '#8b5cf6' }, // purple
  '1':  { symbol: '1',  color: '#06b6d4' }, // cyan
  '2':  { symbol: '2',  color: '#22c55e' }, // green
  '3':  { symbol: '3',  color: '#f97316' }, // orange
  '4':  { symbol: '4',  color: '#64748b' }, // slate
  '5':  { symbol: '5',  color: '#64748b' },
  '6':  { symbol: '6',  color: '#64748b' },
  '7':  { symbol: '7',  color: '#3b82f6' }, // blue
  '8':  { symbol: '8',  color: '#3b82f6' },
  '9':  { symbol: '9',  color: '#ec4899' }, // pink
  '10': { symbol: '10', color: '#dc2626' }, // bright red
};
