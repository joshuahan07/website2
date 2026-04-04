# API Integration Guide

## Hooks

### `useSpeechSynthesis()`
```ts
import useSpeechSynthesis from '@/hooks/useSpeechSynthesis';

const { speak, stop, isSpeaking, isMuted, toggleMute } = useSpeechSynthesis();
```
- `speak(text: string, options?: SpeechOptions)` — Queue text-to-speech. Options: `rate`, `pitch`, `volume`, `voice`.
- `stop()` — Cancel current speech.
- `isSpeaking` — `boolean`, true while speaking.
- `isMuted` / `toggleMute()` — Mute control.
- Falls back gracefully if `window.speechSynthesis` is unavailable.

### `useSpeechRecognition(theme: ThemeId)`
```ts
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

const { startListening, stopListening, isListening, transcript, lastCommand, error } = useSpeechRecognition(themeId);
```
- `startListening()` / `stopListening()` — Toggle continuous voice recognition.
- `isListening` — `boolean`, true while mic is active.
- `transcript` — Latest recognized text.
- `lastCommand` — Parsed `GameCommand | null` from the transcript.
- `error` — Error string or `null`.
- Accepts current theme so piece names are parsed correctly.
- Returns `null` for `lastCommand` if transcript doesn't match any known command.

### `useGeolocation()`
```ts
import useGeolocation from '@/hooks/useGeolocation';

const { latitude, longitude, isLoading, error, isPermissionDenied } = useGeolocation();
```
- Calls `navigator.geolocation.getCurrentPosition()` on mount.
- `latitude` / `longitude` — `number | null`.
- `isPermissionDenied` — `boolean`, true if user denied permission.

### `useNotifications()`
```ts
import useNotifications from '@/hooks/useNotifications';

const { sendNotification, permissionState, requestPermission } = useNotifications();
```
- `sendNotification(title: string, body: string, icon?: string)` — Sends a browser notification only when the tab is not visible.
- `permissionState` — `'default' | 'granted' | 'denied'`.
- `requestPermission()` — Triggers the browser permission prompt. Call during lobby, not gameplay.

### `useDragAndDrop({ onDrop })`
```ts
import useDragAndDrop from '@/hooks/useDragAndDrop';

const { dragHandlers, dropHandlers, draggedPiece, isDragging, highlightedSquare, isHighlightValid, isTouchDevice } = useDragAndDrop({
  onDrop: (data: DragPieceData, row: number, col: number) => { /* place piece */ }
});
```
- `dragHandlers` — `{ onDragStart, onDragEnd }` to spread on draggable elements.
- `dropHandlers(row, col, isValid)` — Factory returning `{ onDragOver, onDragEnter, onDragLeave, onDrop }` for each board square.
- `draggedPiece` — Currently dragged `DragPieceData | null`.
- `isDragging` — `boolean`.
- `highlightedSquare` / `isHighlightValid` — Which square is hovered and whether it's a valid target.
- `isTouchDevice` — `boolean`, use to switch to tap-to-place mode.

---

## Components

### `<NarrationPlayer theme={themeId} />`
```tsx
import NarrationPlayer, { NarrationPlayerHandle } from '@/components/api/NarrationPlayer';

const narrationRef = useRef<NarrationPlayerHandle>(null);

// Trigger narration:
narrationRef.current?.narrate('combat_kill', { winnerPiece: 'King', loserPiece: 'Assassin' });

<NarrationPlayer ref={narrationRef} theme={themeId} />
```
- Place at the **bottom of the game layout**.
- Uses `forwardRef` — call `narrate(event, details?)` imperatively.
- Shows subtitle text while speaking, fades out after 2s.
- Falls back to text-only toast if Speech Synthesis is unsupported.
- Has built-in mute/unmute toggle button.

**Event types:** `'combat_kill'` | `'spy_kills_marshal'` | `'miner_defuses_bomb'` | `'spotter_correct'` | `'spotter_wrong'` | `'scout_long_move'` | `'flag_captured'` | `'turn_start_yours'` | `'turn_start_opponent'` | `'equal_rank'`

**EventDetails:** `{ winnerPiece?, loserPiece?, piece?, position? }`

### `<VoiceCommander theme={themeId} onCommand={handleCommand} />`
```tsx
import VoiceCommander from '@/components/api/VoiceCommander';

function handleCommand(command: GameCommand) {
  // command.type: 'move' | 'attack' | 'predict' | 'ready' | 'theme' | 'cancel'
  // command.piece, command.from, command.to, command.prediction, command.theme
}

<VoiceCommander theme={themeId} onCommand={handleCommand} />
```
- Place at the **bottom-right** (fixed position).
- Mic toggle button; pulsing red when active.
- Shows live transcript and parsed command with 2s confirmation window.
- Hides entirely if Speech Recognition is unsupported.
- One-time toast on permission denied.

### `<PlayerMap player1={coords} player2={coords} theme={themeId} />`
```tsx
import PlayerMap from '@/components/api/PlayerMap';
import { PlayerCoords } from '@/types/api';

<PlayerMap
  player1={{ latitude: 40.7, longitude: -74.0 }}
  player2={{ latitude: 51.5, longitude: -0.1 }}
  theme={themeId}
/>
```
- Place in the **sidebar or top-left corner**.
- 250x150px SVG mini world map with two pulsing player dots.
- Animated dashed line connecting players.
- Shows distance: "Battling across 2,847 miles".
- Handles null coords gracefully ("Location hidden").

### `<GeolocationPrompt onAllow={handler} onDeny={handler} />`
```tsx
import GeolocationPrompt from '@/components/api/GeolocationPrompt';

<GeolocationPrompt
  onAllow={() => { /* trigger useGeolocation */ }}
  onDeny={() => { /* hide prompt, skip map */ }}
/>
```
- Show in the **lobby** before game starts.
- Modal asking to share location.
- "Allow" and "No thanks" buttons.

### `<NotificationManager theme={themeId} gameState={state} />`
```tsx
import NotificationManager from '@/components/api/NotificationManager';

<NotificationManager theme={themeId} gameState={clientGameState} />
```
- **Invisible component** (renders null) — place anywhere in the tree.
- Automatically sends notifications on:
  - Your turn (when tab is hidden)
  - Your piece killed
  - Opponent disconnected / reconnected
- Changes `document.title` to indicate turn when tabbed away.
- Props shape for `gameState`:
  ```ts
  {
    phase: GamePhase;
    myPlayer: PlayerNumber;
    currentTurn: PlayerNumber;
    opponentConnected: boolean;
    moveLog: MoveLogEntry[];
  }
  ```

### `<DragDropPiece>` — Wrap each tray/board piece during setup
```tsx
import DragDropPiece from '@/components/api/DragDropPiece';

<DragDropPiece
  piece={piece}
  theme={themeId}
  sourceType="tray"
  count={remainingCount}
  dragHandlers={dragHandlers}
  onDoubleClick={() => returnToTray(piece)}
  onTapSelect={(data) => selectForTapPlace(data)}
  isSelected={selectedPieceId === piece.id}
>
  <Piece piece={piece} isOwn={true} />
</DragDropPiece>
```
- Wraps children with `draggable="true"`.
- Visual feedback: opacity + scale on drag.
- Count badge shown when `count` is provided.
- Double-click to return piece to tray.
- `onTapSelect` for touch device fallback.

### `<DragDropZone>` — Wrap each board square during setup
```tsx
import DragDropZone from '@/components/api/DragDropZone';

<DragDropZone
  row={row}
  col={col}
  isValidTarget={isValidPlacement(row, col)}
  dropHandlers={dropHandlers(row, col, isValidPlacement(row, col))}
  onTapPlace={() => placeSelectedPiece(row, col)}
>
  <Square row={row} col={col}>
    {/* existing square content */}
  </Square>
</DragDropZone>
```
- Green glow for valid drop targets, red for invalid.
- Snap-to-grid centering.
- `onTapPlace` for touch device fallback.

---

## Socket Events Added

Add to your socket handlers:

```ts
// Client emits after getting geolocation:
socket.emit(C2S.PLAYER_LOCATION, { latitude, longitude, playerId });

// Client listens for opponent location:
socket.on(S2C.PLAYER_LOCATION, (data: { latitude: number; longitude: number; playerId: string }) => {
  setOpponentCoords(data);
});
```

Event constant already added to `/src/lib/socketEvents.ts`:
- `C2S.PLAYER_LOCATION = 'player:location'`
- `S2C.PLAYER_LOCATION = 'player:location'`

---

## Utility Functions

### `getNarration(theme, event, details)` — from `@/lib/apis/speechSynthesis`
Returns a themed narration string for a given game event. Used internally by `NarrationPlayer`.

### `parseCommand(transcript, theme)` — from `@/lib/apis/speechRecognition`
Parses a voice transcript into a `GameCommand`. Used internally by `useSpeechRecognition`.

### `getNotificationContent(theme, event, details?)` — from `@/lib/apis/notifications`
Returns `{ title, body }` for browser notifications. Used internally by `NotificationManager`.

### `calculateDistance(lat1, lon1, lat2, lon2)` — from `@/lib/apis/geolocation`
Haversine formula. Returns distance in miles.

### `formatDistance(miles)` — from `@/lib/apis/geolocation`
Formats miles as a readable string: "2,847 miles".

---

## Types

All API types are in `@/types/api.ts`:
- `SpeechOptions`, `GameEventType`, `EventDetails`
- `GameCommand`, `CommandType`
- `PlayerCoords`
- `NotificationPermissionState`
- `DragPieceData`, `DragHandlers`, `DropHandlers`
- Return types: `UseSpeechSynthesisReturn`, `UseSpeechRecognitionReturn`, `UseGeolocationReturn`, `UseNotificationsReturn`, `UseDragAndDropReturn`

---

## Graceful Degradation Summary

| API | Fallback |
|-----|----------|
| Speech Synthesis | Text-only narration toasts |
| Speech Recognition | Mic button hidden entirely |
| Geolocation | Map hidden or "Location unavailable" |
| Notifications | Silent skip; title change still works |
| Drag and Drop | Tap-to-select, tap-to-place on touch devices |
