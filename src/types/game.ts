export type Rank = 'F' | 'B' | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';

export type PlayerNumber = 1 | 2;

export interface PieceDefinition {
  rank: Rank;
  name: string;
  quantity: number;
  movable: boolean;
  moveRange: number; // 1 for normal, Infinity for Scout, 0 for immovable
}

export interface Piece {
  id: string;
  rank: Rank;
  name: string;
  owner: PlayerNumber;
  revealed?: boolean; // temporarily revealed to opponent
}

export interface Square {
  row: number;
  col: number;
}

export interface PlacedPiece extends Piece {
  row: number;
  col: number;
}

// What the client sees for opponent pieces (no rank/name info)
export interface HiddenPiece {
  id: string;
  owner: PlayerNumber;
  row: number;
  col: number;
  revealed?: boolean;
  rank?: Rank;   // only set when revealed
  name?: string; // only set when revealed
}

export interface VisiblePiece extends PlacedPiece {
  // full info — your own pieces
}

export type ClientPiece = VisiblePiece | HiddenPiece;

export interface CombatResult {
  attacker: PlacedPiece;
  defender: PlacedPiece;
  winner: 'attacker' | 'defender' | 'both_destroyed' | 'flag_captured';
  attackerSurvived: boolean;
  defenderSurvived: boolean;
  specialType?: 'spy_kills_marshal' | 'miner_defuses_bomb' | 'bomb_destroys' | 'flag_captured';
}

export interface SpotterPrediction {
  spotterPosition: Square;
  targetPosition: Square;
  predictedRank: Rank;
}

export interface SpotterResult {
  correct: boolean;
  targetPiece: PlacedPiece; // revealed to both players
  spotterPiece: PlacedPiece;
}

export interface Move {
  from: Square;
  to: Square;
  pieceId: string;
  timestamp: number;
}

export interface MoveLogEntry {
  moveNumber: number;
  player: PlayerNumber;
  from: Square;
  to: Square;
  pieceName?: string; // only shown if revealed
  pieceRank?: Rank;
  combat?: {
    attackerName: string;
    attackerRank: Rank;
    defenderName: string;
    defenderRank: Rank;
    result: string;
  };
  spotter?: {
    correct: boolean;
    predictedRank: Rank;
    targetName: string;
    targetRank: Rank;
  };
}

export type GamePhase = 'waiting' | 'setup' | 'playing' | 'gameover';

export interface Player {
  id: string; // socket id
  number: PlayerNumber;
  ready: boolean;
  connected: boolean;
  disconnectedAt?: number;
  nickname?: string;
}

export interface CapturedPieces {
  1: PlacedPiece[]; // pieces captured FROM player 1
  2: PlacedPiece[]; // pieces captured FROM player 2
}

// Full server-side game state
export interface GameState {
  roomCode: string;
  phase: GamePhase;
  players: Player[];
  board: (PlacedPiece | null)[][]; // 10x8 grid
  currentTurn: PlayerNumber;
  moveLog: MoveLogEntry[];
  capturedPieces: CapturedPieces;
  winner?: PlayerNumber;
  winReason?: string;
  setupPieces: {
    1: PlacedPiece[];
    2: PlacedPiece[];
  };
  awaitingSpotter?: boolean;
  roomTheme?: string;
}

// What gets sent to each client (opponent pieces hidden)
export interface ClientGameState {
  roomCode: string;
  phase: GamePhase;
  myPlayer: PlayerNumber;
  currentTurn: PlayerNumber;
  board: (ClientPiece | null)[][];
  moveLog: MoveLogEntry[];
  capturedPieces: {
    mine: PlacedPiece[];     // my pieces that were captured
    theirs: PlacedPiece[];   // opponent pieces I've seen captured
  };
  winner?: PlayerNumber;
  winReason?: string;
  opponentReady: boolean;
  opponentConnected: boolean;
  myNickname?: string;
  opponentNickname?: string;
  awaitingSpotter?: {
    spotterPosition: Square;
    adjacentTargets: Square[];
  };
  roomTheme?: string;
  coinFlip?: {
    player1Name: string;
    player2Name: string;
    winner: PlayerNumber;
  };
}

export interface RevealEvent {
  type: 'combat' | 'scout_move' | 'spy_kills_marshal' | 'miner_defuses_bomb' | 'spotter_reveal';
  pieces: { position: Square; rank: Rank; name: string; owner: PlayerNumber }[];
  result?: CombatResult;
  spotterResult?: SpotterResult;
  duration: number; // ms to show reveal
}

export interface SetupPlacement {
  pieceId: string;
  rank: Rank;
  row: number;
  col: number;
}

export interface ValidMoveResult {
  valid: boolean;
  reason?: string;
}
