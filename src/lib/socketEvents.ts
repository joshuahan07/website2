// Client -> Server events
export const C2S = {
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  PLACE_PIECES: 'place_pieces',
  PLAYER_READY: 'player_ready',
  MAKE_MOVE: 'make_move',
  SPOTTER_PREDICT: 'spotter_predict',
  PLAY_AGAIN: 'play_again',
  PLAYER_LOCATION: 'player:location',
  SET_NICKNAME: 'set_nickname',
  CREATE_BOT_GAME: 'create_bot_game',
} as const;

// Server -> Client events
export const S2C = {
  ROOM_CREATED: 'room_created',
  ROOM_JOINED: 'room_joined',
  PLAYER_JOINED: 'player_joined',
  GAME_STATE: 'game_state',
  PHASE_CHANGE: 'phase_change',
  OPPONENT_READY: 'opponent_ready',
  MOVE_RESULT: 'move_result',
  REVEAL_EVENT: 'reveal_event',
  SPOTTER_PROMPT: 'spotter_prompt',
  SPOTTER_RESULT: 'spotter_result',
  GAME_OVER: 'game_over',
  OPPONENT_DISCONNECTED: 'opponent_disconnected',
  OPPONENT_RECONNECTED: 'opponent_reconnected',
  ERROR: 'error',
  INVALID_MOVE: 'invalid_move',
  PLAYER_LOCATION: 'player:location',
} as const;
