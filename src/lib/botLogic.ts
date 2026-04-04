import {
  PlacedPiece, Square, PlayerNumber, Rank, GameState,
} from '@/types/game';
import {
  getValidMoves, isLake, BOARD_ROWS, BOARD_COLS,
} from './gameLogic';
import { generatePieceSet, getPieceDefinition, getRankValue } from './pieces';

// ── Smart placement: flag in back row, bombs nearby ─────

export function botPlacePieces(player: PlayerNumber): PlacedPiece[] {
  const pieces = generatePieceSet(player);
  const backRow = player === 1 ? 7 : 0;
  const midRow = player === 1 ? 6 : 1;
  const frontRow = player === 1 ? 5 : 2;

  // Separate pieces by role
  const flag = pieces.find(p => p.rank === 'F')!;
  const bombs = pieces.filter(p => p.rank === 'B');
  const spy = pieces.find(p => p.rank === '0')!;
  const scouts = pieces.filter(p => p.rank === '2');
  const miners = pieces.filter(p => p.rank === '3');
  const rest = pieces.filter(p =>
    p.rank !== 'F' && p.rank !== 'B' && p.rank !== '0' &&
    p.rank !== '2' && p.rank !== '3'
  );

  const placed: PlacedPiece[] = [];
  const occupied = new Set<string>();

  function placeAt(piece: typeof pieces[0], row: number, col: number) {
    placed.push({ ...piece, row, col });
    occupied.add(`${row},${col}`);
  }

  function isOpen(row: number, col: number): boolean {
    return !occupied.has(`${row},${col}`) && !isLake(row, col) &&
      row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS;
  }

  function getOpenInRow(row: number): number[] {
    const cols: number[] = [];
    for (let c = 0; c < BOARD_COLS; c++) {
      if (isOpen(row, c)) cols.push(c);
    }
    return cols;
  }

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // 1. Place flag randomly in the back row
  const backCols = shuffle(getOpenInRow(backRow));
  const flagCol = backCols[0];
  placeAt(flag, backRow, flagCol);

  // 2. Place bombs adjacent to flag (as many as possible)
  const adjacentToFlag: Square[] = [];
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const r = backRow + dr;
    const c = flagCol + dc;
    // Only place in valid setup rows
    const validRow = player === 1 ? (r >= 5 && r <= 7) : (r >= 0 && r <= 2);
    if (validRow && isOpen(r, c)) {
      adjacentToFlag.push({ row: r, col: c });
    }
  }

  const shuffledAdj = shuffle(adjacentToFlag);
  let bombIdx = 0;
  for (const pos of shuffledAdj) {
    if (bombIdx >= bombs.length) break;
    if (isOpen(pos.row, pos.col)) {
      placeAt(bombs[bombIdx], pos.row, pos.col);
      bombIdx++;
    }
  }

  // Place remaining bombs in the back row
  const remainingBackCols = shuffle(getOpenInRow(backRow));
  for (const col of remainingBackCols) {
    if (bombIdx >= bombs.length) break;
    placeAt(bombs[bombIdx], backRow, col);
    bombIdx++;
  }

  // Place any still-remaining bombs in mid row
  if (bombIdx < bombs.length) {
    const midCols = shuffle(getOpenInRow(midRow));
    for (const col of midCols) {
      if (bombIdx >= bombs.length) break;
      placeAt(bombs[bombIdx], midRow, col);
      bombIdx++;
    }
  }

  // 3. Place spy in back or mid row (safe)
  const safeCols = shuffle([...getOpenInRow(backRow), ...getOpenInRow(midRow)]);
  if (safeCols.length > 0) {
    // Pick a random open spot from back/mid
    for (const col of getOpenInRow(backRow)) {
      if (isOpen(backRow, col)) {
        placeAt(spy, backRow, col);
        break;
      }
    }
    if (!placed.includes(spy as any)) {
      for (const col of getOpenInRow(midRow)) {
        if (isOpen(midRow, col)) {
          placeAt(spy, midRow, col);
          break;
        }
      }
    }
  }
  // Fallback: if spy still not placed
  if (placed.findIndex(p => p.id === spy.id) === -1) {
    const anyCols = shuffle(getOpenInRow(frontRow));
    if (anyCols.length > 0) placeAt(spy, frontRow, anyCols[0]);
  }

  // 4. Place scouts on front row (for recon)
  const frontCols = shuffle(getOpenInRow(frontRow));
  let scoutIdx = 0;
  for (const col of frontCols) {
    if (scoutIdx >= scouts.length) break;
    placeAt(scouts[scoutIdx], frontRow, col);
    scoutIdx++;
  }

  // 5. Place miners spread across mid and front
  const minerPositions = shuffle([...getOpenInRow(midRow).map(c => ({ row: midRow, col: c })),
    ...getOpenInRow(frontRow).map(c => ({ row: frontRow, col: c }))]);
  let minerIdx = 0;
  for (const pos of minerPositions) {
    if (minerIdx >= miners.length) break;
    if (isOpen(pos.row, pos.col)) {
      placeAt(miners[minerIdx], pos.row, pos.col);
      minerIdx++;
    }
  }

  // 6. Place remaining pieces in any open spots
  const allRemaining = [
    ...scouts.slice(scoutIdx),
    ...miners.slice(minerIdx),
    ...shuffle(rest),
  ];

  const allOpenSpots = shuffle([
    ...getOpenInRow(frontRow).map(c => ({ row: frontRow, col: c })),
    ...getOpenInRow(midRow).map(c => ({ row: midRow, col: c })),
    ...getOpenInRow(backRow).map(c => ({ row: backRow, col: c })),
  ]);

  let remainIdx = 0;
  for (const pos of allOpenSpots) {
    if (remainIdx >= allRemaining.length) break;
    if (isOpen(pos.row, pos.col)) {
      placeAt(allRemaining[remainIdx], pos.row, pos.col);
      remainIdx++;
    }
  }

  return placed;
}

// ── Smart move selection ────────────────────────────────

interface BotMoveCandidate {
  piece: PlacedPiece;
  from: Square;
  to: Square;
  score: number;
}

export function botChooseMove(
  game: GameState,
  botPlayer: PlayerNumber,
  lastMovedPieceId: string | null,
): { from: Square; to: Square; movedPieceId: string } | null {
  const opponent: PlayerNumber = botPlayer === 1 ? 2 : 1;

  // Collect all known info about opponent pieces (from combat reveals)
  const knownEnemyMarshal = findKnownPiece(game, opponent, '10');
  const enemyMarshalRevealed = knownEnemyMarshal !== null;

  // Find flag position for proximity scoring
  const botFlag = findOwnPiece(game, botPlayer, 'F');

  const candidates: BotMoveCandidate[] = [];

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = game.board[r][c];
      if (!piece || piece.owner !== botPlayer) continue;

      const def = getPieceDefinition(piece.rank);
      if (!def.movable) continue;

      const moves = getValidMoves(piece, game.board);
      for (const move of moves) {
        let score = 10; // base score

        const target = game.board[move.row][move.col];

        // ── Priority 1: Capture opportunities
        if (target && target.owner === opponent) {
          score += 50; // strong incentive to attack

          // If we know the target piece rank (revealed), evaluate combat
          if (target.revealed && target.rank) {
            const myVal = getRankValue(piece.rank);
            const theirVal = getRankValue(target.rank);

            if (piece.rank === '0' && target.rank === '10') {
              score += 200; // spy kills marshal - huge priority
            } else if (piece.rank === '3' && target.rank === 'B') {
              score += 100; // miner defuses bomb
            } else if (myVal > theirVal) {
              score += 40; // we win combat
            } else if (myVal === theirVal) {
              score -= 20; // mutual destruction, meh
            } else {
              score -= 60; // we lose, avoid
            }
          }
          // Unknown target - still worth attacking with expendable pieces
          if (getRankValue(piece.rank) <= 5) {
            score += 10; // lower rank = more expendable
          }
        }

        // ── Priority 2: Scouts move forward for recon
        if (piece.rank === '2') {
          const forwardDir = botPlayer === 1 ? -1 : 1;
          const forwardDist = (move.row - piece.row) * forwardDir;
          if (forwardDist > 0) {
            score += 5 * forwardDist;
          }
        }

        // ── Priority 3: Avoid moving same piece twice
        if (piece.id === lastMovedPieceId) {
          score -= 15;
        }

        // ── Priority 4: Keep spy alive until marshal spotted
        if (piece.rank === '0' && !enemyMarshalRevealed) {
          // Don't attack unknown pieces with the spy
          if (target && !target.revealed) {
            score -= 80;
          }
          // Prefer spy stays back
          score -= 5;
        }

        // ── Priority 5: Keep pieces near flag for defense
        if (botFlag) {
          const distToFlag = Math.abs(piece.row - botFlag.row) + Math.abs(piece.col - botFlag.col);
          const newDistToFlag = Math.abs(move.row - botFlag.row) + Math.abs(move.col - botFlag.col);
          // Slight bonus for staying near flag, but don't make everyone huddle
          if (distToFlag <= 2 && newDistToFlag > distToFlag) {
            score -= 5; // discourage moving away from flag if close
          }
        }

        // ── Priority 6: Generally move forward
        const forwardDir = botPlayer === 1 ? -1 : 1;
        if ((move.row - piece.row) * forwardDir > 0) {
          score += 3;
        }

        // ── Priority 7: Don't move high-value pieces recklessly
        if (piece.rank === '10' || piece.rank === '9') {
          if (target && !target.revealed) {
            score -= 20; // risky to attack unknowns with top pieces
          }
        }

        candidates.push({
          piece,
          from: { row: piece.row, col: piece.col },
          to: move,
          score,
        });
      }
    }
  }

  if (candidates.length === 0) return null;

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  // Pick from top candidates with some randomness (weighted)
  // Take the top ~5 candidates and pick randomly weighted by score
  const topN = Math.min(5, candidates.length);
  const topCandidates = candidates.slice(0, topN);

  // Shift scores to be positive for weighting
  const minScore = Math.min(...topCandidates.map(c => c.score));
  const shifted = topCandidates.map(c => ({
    ...c,
    weight: Math.max(c.score - minScore + 1, 1),
  }));

  const totalWeight = shifted.reduce((sum, c) => sum + c.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const c of shifted) {
    roll -= c.weight;
    if (roll <= 0) {
      return { from: c.from, to: c.to, movedPieceId: c.piece.id };
    }
  }

  // Fallback
  const pick = topCandidates[0];
  return { from: pick.from, to: pick.to, movedPieceId: pick.piece.id };
}

// ── Bot spotter prediction (random guess) ───────────────

export function botSpotterPredict(
  targets: Square[],
  board: (PlacedPiece | null)[][],
): { targetPosition: Square; predictedRank: Rank } | null {
  if (targets.length === 0) return null;

  // Pick a random target
  const target = targets[Math.floor(Math.random() * targets.length)];

  // Guess a common rank (weighted toward common pieces)
  const guessPool: Rank[] = [
    '2', '2', '2',    // Scout (5 of them)
    '3', '3', '3',    // Miner (5 of them)
    'B', 'B', 'B',    // Bomb (5 of them)
    '4', '4',          // Sergeant (2)
    '5', '5',          // Lieutenant (2)
    '6', '6',          // Captain (2)
    '7', '7',          // Major (2)
    '1',               // Spotter (2)
    '8',               // Colonel (1)
    '9',               // General (1)
    '10',              // Marshal (1)
    '0',               // Spy (1)
    'F',               // Flag (1)
  ];

  const predictedRank = guessPool[Math.floor(Math.random() * guessPool.length)];

  return { targetPosition: target, predictedRank };
}

// ── Helpers ─────────────────────────────────────────────

function findOwnPiece(game: GameState, player: PlayerNumber, rank: Rank): PlacedPiece | null {
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const p = game.board[r][c];
      if (p && p.owner === player && p.rank === rank) return p;
    }
  }
  return null;
}

function findKnownPiece(game: GameState, player: PlayerNumber, rank: Rank): PlacedPiece | null {
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const p = game.board[r][c];
      if (p && p.owner === player && p.rank === rank && p.revealed) return p;
    }
  }
  return null;
}
