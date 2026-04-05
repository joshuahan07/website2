import {
  PlacedPiece, Square, PlayerNumber, CombatResult, GameState,
  ValidMoveResult, Rank, MoveLogEntry, ClientGameState, HiddenPiece,
  VisiblePiece, RevealEvent, SpotterResult, ClientPiece,
} from '@/types/game';
import { getPieceDefinition, getRankValue, generatePieceSet, TOTAL_PIECES } from './pieces';

// ── Board Constants ──────────────────────────────────────

export const BOARD_COLS = 10;
export const BOARD_ROWS = 8;

export const LAKES: Square[] = [
  // Left lake
  { row: 3, col: 2 }, { row: 3, col: 3 },
  { row: 4, col: 2 }, { row: 4, col: 3 },
  // Right lake
  { row: 3, col: 6 }, { row: 3, col: 7 },
  { row: 4, col: 6 }, { row: 4, col: 7 },
];

export function isLake(row: number, col: number): boolean {
  return LAKES.some(l => l.row === row && l.col === col);
}

export function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS;
}

// ── Board Creation ───────────────────────────────────────

export function createEmptyBoard(): (PlacedPiece | null)[][] {
  const board: (PlacedPiece | null)[][] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    board[r] = [];
    for (let c = 0; c < BOARD_COLS; c++) {
      board[r][c] = null;
    }
  }
  return board;
}

// ── Setup Validation ─────────────────────────────────────

export function isValidSetupRow(row: number, player: PlayerNumber): boolean {
  if (player === 1) return row >= 5 && row <= 7; // bottom 3 rows
  return row >= 0 && row <= 2; // top 3 rows
}

export function validateSetup(pieces: PlacedPiece[], player: PlayerNumber): { valid: boolean; reason?: string } {
  if (pieces.length !== TOTAL_PIECES) {
    return { valid: false, reason: `Must place all ${TOTAL_PIECES} pieces (placed ${pieces.length})` };
  }

  for (const piece of pieces) {
    if (!isValidSetupRow(piece.row, player)) {
      return { valid: false, reason: `Piece ${piece.name} is not in valid setup rows` };
    }
    if (isLake(piece.row, piece.col)) {
      return { valid: false, reason: `Cannot place pieces on lakes` };
    }
  }

  // Check for duplicates on same square
  const positions = new Set<string>();
  for (const piece of pieces) {
    const key = `${piece.row},${piece.col}`;
    if (positions.has(key)) {
      return { valid: false, reason: `Multiple pieces on same square` };
    }
    positions.add(key);
  }

  return { valid: true };
}

// ── Move Validation ──────────────────────────────────────

export function getValidMoves(piece: PlacedPiece, board: (PlacedPiece | null)[][]): Square[] {
  const def = getPieceDefinition(piece.rank);
  if (!def.movable) return [];

  const moves: Square[] = [];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // up, down, left, right

  if (def.moveRange === 1) {
    // Normal piece — 1 square in each direction
    for (const [dr, dc] of directions) {
      const nr = piece.row + dr;
      const nc = piece.col + dc;
      if (!isInBounds(nr, nc)) continue;
      if (isLake(nr, nc)) continue;
      const target = board[nr][nc];
      if (target && target.owner === piece.owner) continue; // can't move onto own piece
      moves.push({ row: nr, col: nc });
    }
  } else {
    // Scout — moves any number of squares in a straight line
    for (const [dr, dc] of directions) {
      let nr = piece.row + dr;
      let nc = piece.col + dc;
      while (isInBounds(nr, nc) && !isLake(nr, nc)) {
        const target = board[nr][nc];
        if (target) {
          if (target.owner !== piece.owner) {
            moves.push({ row: nr, col: nc }); // can attack enemy
          }
          break; // can't jump pieces
        }
        moves.push({ row: nr, col: nc });
        nr += dr;
        nc += dc;
      }
    }
  }

  return moves;
}

export function validateMove(
  from: Square, to: Square, player: PlayerNumber, board: (PlacedPiece | null)[][]
): ValidMoveResult {
  const piece = board[from.row][from.col];
  if (!piece) return { valid: false, reason: 'No piece at source square' };
  if (piece.owner !== player) return { valid: false, reason: 'Not your piece' };

  const validMoves = getValidMoves(piece, board);
  const isValid = validMoves.some(m => m.row === to.row && m.col === to.col);

  if (!isValid) return { valid: false, reason: 'Invalid move for this piece' };
  return { valid: true };
}

// ── Combat ───────────────────────────────────────────────

export function resolveCombat(attacker: PlacedPiece, defender: PlacedPiece): CombatResult {
  // Flag captured
  if (defender.rank === 'F') {
    return {
      attacker, defender,
      winner: 'flag_captured',
      attackerSurvived: true,
      defenderSurvived: false,
      specialType: 'flag_captured',
    };
  }

  // Bomb
  if (defender.rank === 'B') {
    if (attacker.rank === '3') {
      // Miner defuses bomb
      return {
        attacker, defender,
        winner: 'attacker',
        attackerSurvived: true,
        defenderSurvived: false,
        specialType: 'miner_defuses_bomb',
      };
    }
    // Bomb destroys attacker
    return {
      attacker, defender,
      winner: 'defender',
      attackerSurvived: false,
      defenderSurvived: true,
      specialType: 'bomb_destroys',
    };
  }

  // Spy attacks Marshal
  if (attacker.rank === '0' && defender.rank === '10') {
    return {
      attacker, defender,
      winner: 'attacker',
      attackerSurvived: true,
      defenderSurvived: false,
      specialType: 'spy_kills_marshal',
    };
  }

  // Standard combat — higher rank wins
  const attackerVal = getRankValue(attacker.rank);
  const defenderVal = getRankValue(defender.rank);

  if (attackerVal > defenderVal) {
    return {
      attacker, defender,
      winner: 'attacker',
      attackerSurvived: true,
      defenderSurvived: false,
    };
  } else if (defenderVal > attackerVal) {
    return {
      attacker, defender,
      winner: 'defender',
      attackerSurvived: false,
      defenderSurvived: true,
    };
  } else {
    // Equal rank — both destroyed
    return {
      attacker, defender,
      winner: 'both_destroyed',
      attackerSurvived: false,
      defenderSurvived: false,
    };
  }
}

// ── Spotter Logic ────────────────────────────────────────

export function getSpotterTargets(
  spotterPos: Square, board: (PlacedPiece | null)[][], spotterOwner: PlayerNumber
): Square[] {
  const targets: Square[] = [];
  // Spotter can only predict the piece directly AHEAD (toward opponent's side)
  // Player 1 faces toward row 0 (ahead = row - 1)
  // Player 2 faces toward row 7 (ahead = row + 1)
  const aheadRow = spotterOwner === 1 ? spotterPos.row - 1 : spotterPos.row + 1;
  const aheadCol = spotterPos.col;

  if (isInBounds(aheadRow, aheadCol)) {
    const target = board[aheadRow][aheadCol];
    if (target && target.owner !== spotterOwner) {
      targets.push({ row: aheadRow, col: aheadCol });
    }
  }

  return targets;
}

export function resolveSpotterPrediction(
  spotterPos: Square,
  targetPos: Square,
  predictedRank: Rank,
  board: (PlacedPiece | null)[][]
): SpotterResult | null {
  const spotter = board[spotterPos.row][spotterPos.col];
  const target = board[targetPos.row][targetPos.col];

  if (!spotter || !target) return null;
  if (spotter.rank !== '1') return null;

  return {
    correct: target.rank === predictedRank,
    targetPiece: { ...target },
    spotterPiece: { ...spotter },
  };
}

// ── Win Condition Check ──────────────────────────────────

export function checkNoMovablePieces(player: PlayerNumber, board: (PlacedPiece | null)[][]): boolean {
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (piece && piece.owner === player) {
        const moves = getValidMoves(piece, board);
        if (moves.length > 0) return false;
      }
    }
  }
  return true;
}

// ── Client State Filtering ───────────────────────────────

export function createClientGameState(
  state: GameState, forPlayer: PlayerNumber
): ClientGameState {
  const opponent: PlayerNumber = forPlayer === 1 ? 2 : 1;

  // Build board view — hide opponent piece identities
  const clientBoard: (ClientPiece | null)[][] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    clientBoard[r] = [];
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = state.board[r][c];
      if (!piece) {
        clientBoard[r][c] = null;
      } else if (piece.owner === forPlayer) {
        // Own piece — full visibility
        clientBoard[r][c] = { ...piece } as VisiblePiece;
      } else {
        // Opponent piece — hidden unless revealed
        const hidden: HiddenPiece = {
          id: piece.id,
          owner: piece.owner,
          row: piece.row,
          col: piece.col,
        };
        if (piece.revealed) {
          hidden.revealed = true;
          hidden.rank = piece.rank;
          hidden.name = piece.name;
        }
        clientBoard[r][c] = hidden;
      }
    }
  }

  const opponentPlayer = state.players.find(p => p.number === opponent);
  const myPlayerObj = state.players.find(p => p.number === forPlayer);

  const clientState: ClientGameState = {
    roomCode: state.roomCode,
    phase: state.phase,
    myPlayer: forPlayer,
    currentTurn: state.currentTurn,
    board: clientBoard,
    moveLog: state.moveLog,
    capturedPieces: {
      mine: state.capturedPieces[forPlayer],
      theirs: state.capturedPieces[opponent],
    },
    winner: state.winner,
    winReason: state.winReason,
    opponentReady: opponentPlayer?.ready ?? false,
    opponentConnected: opponentPlayer?.connected ?? true,
    myNickname: myPlayerObj?.nickname,
    opponentNickname: opponentPlayer?.nickname,
  };

  // Propagate pending spotter prompt so it survives reconnects
  if (state.awaitingSpotter && state.currentTurn === forPlayer) {
    // Find the spotter piece and its adjacent targets
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const piece = state.board[r][c];
        if (piece && piece.owner === forPlayer && piece.rank === '1') {
          const targets = getSpotterTargets({ row: r, col: c }, state.board, forPlayer);
          if (targets.length > 0) {
            clientState.awaitingSpotter = {
              spotterPosition: { row: r, col: c },
              adjacentTargets: targets,
            };
            break;
          }
        }
      }
      if (clientState.awaitingSpotter) break;
    }
  }

  return clientState;
}

// ── Move Execution (server-side) ─────────────────────────

export interface MoveResult {
  success: boolean;
  combat?: CombatResult;
  reveal?: RevealEvent;
  spotterPrompt?: { spotterPosition: Square; adjacentTargets: Square[] };
  logEntry?: MoveLogEntry;
  gameOver?: { winner: PlayerNumber; reason: string };
}

export function executeMove(
  state: GameState, from: Square, to: Square, player: PlayerNumber
): MoveResult {
  const piece = state.board[from.row][from.col];
  if (!piece) return { success: false };

  const validation = validateMove(from, to, player, state.board);
  if (!validation.valid) return { success: false };

  const target = state.board[to.row][to.col];
  const moveNum = state.moveLog.length + 1;

  // Check if Scout moved more than 1 square
  const isLongScoutMove = piece.rank === '2' &&
    (Math.abs(to.row - from.row) > 1 || Math.abs(to.col - from.col) > 1);

  if (target && target.owner !== player) {
    // COMBAT
    const combatResult = resolveCombat(piece, target);

    const logEntry: MoveLogEntry = {
      moveNumber: moveNum,
      player,
      from, to,
      pieceName: piece.name,
      pieceRank: piece.rank,
      combat: {
        attackerName: piece.name,
        attackerRank: piece.rank,
        defenderName: target.name,
        defenderRank: target.rank,
        result: combatResult.winner === 'flag_captured' ? 'Flag captured!'
          : combatResult.winner === 'both_destroyed' ? 'Both destroyed'
          : combatResult.winner === 'attacker' ? `${piece.name} wins`
          : `${target.name} wins`,
      },
    };

    // Build reveal event
    const revealPieces = [
      { position: from, rank: piece.rank, name: piece.name, owner: piece.owner },
      { position: to, rank: target.rank, name: target.name, owner: target.owner },
    ];

    const reveal: RevealEvent = {
      type: combatResult.specialType === 'spy_kills_marshal' ? 'spy_kills_marshal'
        : combatResult.specialType === 'miner_defuses_bomb' ? 'miner_defuses_bomb'
        : 'combat',
      pieces: revealPieces,
      result: combatResult,
      duration: 3000,
    };

    // Update board
    state.board[from.row][from.col] = null;

    if (combatResult.attackerSurvived) {
      state.board[to.row][to.col] = { ...piece, row: to.row, col: to.col, revealed: true };
    } else {
      state.board[to.row][to.col] = combatResult.defenderSurvived
        ? { ...target, revealed: true }
        : null;
    }

    // Track captured pieces
    if (!combatResult.attackerSurvived) {
      state.capturedPieces[piece.owner].push(piece);
    }
    if (!combatResult.defenderSurvived) {
      state.capturedPieces[target.owner].push(target);
    }

    state.moveLog.push(logEntry);

    // Check for flag capture
    if (combatResult.specialType === 'flag_captured') {
      state.phase = 'gameover';
      state.winner = player;
      state.winReason = `Player ${player} captured the flag!`;
      return {
        success: true,
        combat: combatResult,
        reveal,
        logEntry,
        gameOver: { winner: player, reason: state.winReason },
      };
    }

    // Switch turn
    state.currentTurn = player === 1 ? 2 : 1;

    // Check if opponent has no movable pieces
    const opponent: PlayerNumber = player === 1 ? 2 : 1;
    if (checkNoMovablePieces(opponent, state.board)) {
      state.phase = 'gameover';
      state.winner = player;
      state.winReason = `Player ${opponent} has no movable pieces!`;
      return {
        success: true,
        combat: combatResult,
        reveal,
        logEntry,
        gameOver: { winner: player, reason: state.winReason },
      };
    }

    return { success: true, combat: combatResult, reveal, logEntry };

  } else {
    // SIMPLE MOVE (no combat)
    state.board[from.row][from.col] = null;
    state.board[to.row][to.col] = { ...piece, row: to.row, col: to.col };

    const logEntry: MoveLogEntry = {
      moveNumber: moveNum,
      player,
      from, to,
    };

    // Scout long move - log it but no popup reveal
    let reveal: RevealEvent | undefined;
    if (isLongScoutMove) {
      logEntry.pieceName = 'Scout';
      logEntry.pieceRank = '2';
    }

    state.moveLog.push(logEntry);

    // Check if Spotter moved adjacent to enemy pieces
    if (piece.rank === '1') {
      const targets = getSpotterTargets(to, state.board, player);
      if (targets.length > 0) {
        // Don't switch turn yet — wait for spotter prediction
        return {
          success: true,
          reveal,
          logEntry,
          spotterPrompt: { spotterPosition: to, adjacentTargets: targets },
        };
      }
    }

    // Switch turn
    state.currentTurn = player === 1 ? 2 : 1;

    // Check if opponent has no movable pieces
    const opponent: PlayerNumber = player === 1 ? 2 : 1;
    if (checkNoMovablePieces(opponent, state.board)) {
      state.phase = 'gameover';
      state.winner = player;
      state.winReason = `Player ${opponent} has no movable pieces!`;
      return {
        success: true,
        reveal,
        logEntry,
        gameOver: { winner: player, reason: state.winReason },
      };
    }

    return { success: true, reveal, logEntry };
  }
}

// ── Auto-place pieces randomly ───────────────────────────

export function autoPlacePieces(player: PlayerNumber): PlacedPiece[] {
  const pieces = generatePieceSet(player);
  const startRow = player === 1 ? 5 : 0;
  const endRow = player === 1 ? 7 : 2;
  // Back row is the furthest from the opponent
  const backRow = player === 1 ? 7 : 0;

  // Build all available positions
  const allPositions: Square[] = [];
  const backRowPositions: Square[] = [];
  for (let r = startRow; r <= endRow; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (!isLake(r, c)) {
        allPositions.push({ row: r, col: c });
        if (r === backRow) backRowPositions.push({ row: r, col: c });
      }
    }
  }

  const used = new Set<string>();
  const placed: PlacedPiece[] = [];

  const placeAt = (piece: typeof pieces[0], pos: Square) => {
    placed.push({ ...piece, row: pos.row, col: pos.col });
    used.add(`${pos.row},${pos.col}`);
  };

  const getAvailable = (positions: Square[]) =>
    positions.filter(p => !used.has(`${p.row},${p.col}`));

  const pickRandom = (positions: Square[]) => {
    const avail = getAvailable(positions);
    return avail[Math.floor(Math.random() * avail.length)];
  };

  // 1. Place flag on a random back row position
  const flag = pieces.find(p => p.rank === 'F')!;
  const flagPos = pickRandom(backRowPositions);
  placeAt(flag, flagPos);

  // 2. Place bombs near the flag (adjacent positions preferred)
  const bombs = pieces.filter(p => p.rank === 'B');
  const getAdjacentPositions = (pos: Square) => {
    const adj: Square[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = pos.row + dr;
        const c = pos.col + dc;
        if (r >= startRow && r <= endRow && c >= 0 && c < BOARD_COLS && !isLake(r, c)) {
          adj.push({ row: r, col: c });
        }
      }
    }
    return adj;
  };

  const flagAdjacent = getAdjacentPositions(flagPos);
  for (const bomb of bombs) {
    // Try adjacent to flag first, then any available
    const adjAvail = getAvailable(flagAdjacent);
    if (adjAvail.length > 0) {
      const pos = adjAvail[Math.floor(Math.random() * adjAvail.length)];
      placeAt(bomb, pos);
    } else {
      placeAt(bomb, pickRandom(allPositions));
    }
  }

  // 3. Place remaining pieces randomly
  const remaining = pieces.filter(p => p.rank !== 'F' && p.rank !== 'B');
  for (const piece of remaining) {
    placeAt(piece, pickRandom(allPositions));
  }

  return placed;
}
