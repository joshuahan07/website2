import { Rank, PlayerNumber, Square } from './game';
import { ThemeId } from '@/lib/themes';

// ── Speech Synthesis ──

export interface SpeechOptions {
  rate?: number;     // 0.1 - 10, default 1
  pitch?: number;    // 0 - 2, default 1
  volume?: number;   // 0 - 1, default 1
  voice?: SpeechSynthesisVoice | null;
}

export type GameEventType =
  | 'combat_kill'
  | 'spy_kills_marshal'
  | 'miner_defuses_bomb'
  | 'spotter_correct'
  | 'spotter_wrong'
  | 'scout_long_move'
  | 'flag_captured'
  | 'turn_start_yours'
  | 'turn_start_opponent'
  | 'equal_rank';

export interface EventDetails {
  winnerPiece?: string;
  loserPiece?: string;
  piece?: string;
  position?: Square;
}

export interface UseSpeechSynthesisReturn {
  speak: (text: string, options?: SpeechOptions) => void;
  stop: () => void;
  isSpeaking: boolean;
  isMuted: boolean;
  toggleMute: () => void;
}

// ── Speech Recognition ──

export type CommandType = 'move' | 'attack' | 'predict' | 'ready' | 'theme' | 'cancel';

export interface GameCommand {
  type: CommandType;
  piece?: string;
  from?: string;
  to?: string;
  prediction?: string;
  theme?: ThemeId;
}

export interface UseSpeechRecognitionReturn {
  startListening: () => void;
  stopListening: () => void;
  isListening: boolean;
  transcript: string;
  lastCommand: GameCommand | null;
  error: string | null;
}

// ── Geolocation ──

export interface PlayerCoords {
  latitude: number;
  longitude: number;
  playerId?: string;
}

export interface UseGeolocationReturn {
  latitude: number | null;
  longitude: number | null;
  isLoading: boolean;
  error: string | null;
  isPermissionDenied: boolean;
}

// ── Notifications ──

export type NotificationPermissionState = 'default' | 'granted' | 'denied';

export interface UseNotificationsReturn {
  sendNotification: (title: string, body: string, icon?: string) => void;
  permissionState: NotificationPermissionState;
  requestPermission: () => Promise<NotificationPermission>;
}

// ── Drag and Drop ──

export interface DragPieceData {
  pieceId: string;
  rank: Rank;
  name: string;
  owner: PlayerNumber;
  sourceType: 'tray' | 'board';
  sourceRow?: number;
  sourceCol?: number;
}

export interface DragHandlers {
  onDragStart: (e: React.DragEvent, data: DragPieceData) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export interface DropHandlers {
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export interface UseDragAndDropReturn {
  dragHandlers: DragHandlers;
  dropHandlers: (row: number, col: number, isValid: boolean) => DropHandlers;
  draggedPiece: DragPieceData | null;
  isDragging: boolean;
  highlightedSquare: { row: number; col: number } | null;
  isHighlightValid: boolean;
}
