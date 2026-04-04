import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import {
  GameState, PlayerNumber, PlacedPiece, Square, Rank,
  RevealEvent, ClientGameState,
} from './src/types/game';
import {
  createEmptyBoard, validateSetup, executeMove, createClientGameState,
  autoPlacePieces, getSpotterTargets, resolveSpotterPrediction,
  checkNoMovablePieces, isValidSetupRow,
} from './src/lib/gameLogic';
import { C2S, S2C } from './src/lib/socketEvents';
import { botPlacePieces, botChooseMove, botSpotterPredict } from './src/lib/botLogic';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '4000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// ── In-memory game store ─────────────────────────────────

const games = new Map<string, GameState>();
const socketToRoom = new Map<string, string>();
const disconnectTimers = new Map<string, NodeJS.Timeout>();
const botGames = new Set<string>(); // room codes with a bot player
const botLastMoved = new Map<string, string | null>(); // roomCode -> last moved piece id

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return games.has(code) ? generateRoomCode() : code;
}

function createGameState(roomCode: string): GameState {
  return {
    roomCode,
    phase: 'waiting',
    players: [],
    board: createEmptyBoard(),
    currentTurn: 1,
    moveLog: [],
    capturedPieces: { 1: [], 2: [] },
    setupPieces: { 1: [], 2: [] },
  };
}

function sendGameState(io: SocketIOServer, game: GameState) {
  for (const player of game.players) {
    if (player.connected && player.id !== 'bot') {
      const clientState = createClientGameState(game, player.number);
      clientState.roomTheme = game.roomTheme;
      io.to(player.id).emit(S2C.GAME_STATE, clientState);
    }
  }
}

// ── Bot move execution ──────────────────────────────────

function executeBotTurn(io: SocketIOServer, roomCode: string) {
  const game = games.get(roomCode);
  if (!game || game.phase !== 'playing') return;
  if (game.currentTurn !== 2) return; // bot is always player 2
  if (!botGames.has(roomCode)) return;

  const lastPieceId = botLastMoved.get(roomCode) ?? null;
  const move = botChooseMove(game, 2, lastPieceId);

  if (!move) {
    // Bot has no moves — game over
    game.phase = 'gameover';
    game.winner = 1;
    game.winReason = 'Bot has no movable pieces!';
    io.to(roomCode).emit(S2C.GAME_OVER, { winner: 1, reason: game.winReason });
    sendGameState(io, game);
    return;
  }

  botLastMoved.set(roomCode, move.movedPieceId);

  const result = executeMove(game, move.from, move.to, 2);
  if (!result.success) {
    // Shouldn't happen, but retry with a different move
    console.error(`Bot move failed in room ${roomCode}, skipping`);
    return;
  }

  if (result.reveal) {
    io.to(roomCode).emit(S2C.REVEAL_EVENT, result.reveal);
    // Delay game state update until after reveal animation finishes
    // so player can see the battle before board updates
    setTimeout(() => {
      if (result.gameOver) {
        game.phase = 'gameover';
        game.winner = result.gameOver.winner;
        game.winReason = result.gameOver.reason;
        io.to(roomCode).emit(S2C.GAME_OVER, result.gameOver);
      }
      sendGameState(io, game);
    }, result.reveal.duration + 300);
    return;
  }

  // Handle spotter prompt — bot makes a prediction
  if (result.spotterPrompt) {
    game.awaitingSpotter = true;

    // Send reveal for spotter to human player
    const p1 = game.players.find(p => p.number === 1);
    if (p1 && p1.connected) {
      const spotterReveal: RevealEvent = {
        type: 'spotter_reveal',
        pieces: [{
          position: result.spotterPrompt.spotterPosition,
          rank: '1',
          name: 'Spotter',
          owner: 2,
        }],
        duration: 3000,
      };
      io.to(p1.id).emit(S2C.REVEAL_EVENT, spotterReveal);
    }

    // Bot predicts after a short delay
    setTimeout(() => {
      const prediction = botSpotterPredict(
        result.spotterPrompt!.adjacentTargets,
        game.board,
      );

      if (!prediction) {
        game.awaitingSpotter = false;
        game.currentTurn = 1;
        sendGameState(io, game);
        return;
      }

      game.awaitingSpotter = false;

      const spotterResult = resolveSpotterPrediction(
        result.spotterPrompt!.spotterPosition,
        prediction.targetPosition,
        prediction.predictedRank,
        game.board,
      );

      if (spotterResult) {
        const logEntry = game.moveLog[game.moveLog.length - 1];
        if (logEntry) {
          logEntry.spotter = {
            correct: spotterResult.correct,
            predictedRank: prediction.predictedRank,
            targetName: spotterResult.targetPiece.name,
            targetRank: spotterResult.targetPiece.rank,
          };
        }

        if (spotterResult.correct) {
          const target = game.board[prediction.targetPosition.row][prediction.targetPosition.col];
          if (target) {
            game.capturedPieces[target.owner].push(target);
            game.board[prediction.targetPosition.row][prediction.targetPosition.col] = null;
          }
        }

        const spotterRevealEvent: RevealEvent = {
          type: 'spotter_reveal',
          pieces: [
            { position: result.spotterPrompt!.spotterPosition, rank: '1', name: 'Spotter', owner: 2 },
            { position: prediction.targetPosition, rank: spotterResult.targetPiece.rank, name: spotterResult.targetPiece.name, owner: spotterResult.targetPiece.owner },
          ],
          spotterResult,
          duration: 3000,
        };
        io.to(roomCode).emit(S2C.REVEAL_EVENT, spotterRevealEvent);
        io.to(roomCode).emit(S2C.SPOTTER_RESULT, {
          correct: spotterResult.correct,
          targetRank: spotterResult.targetPiece.rank,
          targetName: spotterResult.targetPiece.name,
        });

        // Check if opponent has no movable pieces
        if (checkNoMovablePieces(1, game.board)) {
          game.phase = 'gameover';
          game.winner = 2;
          game.winReason = 'Player 1 has no movable pieces!';
          io.to(roomCode).emit(S2C.GAME_OVER, { winner: 2, reason: game.winReason });
        }
      }

      game.currentTurn = 1;
      sendGameState(io, game);
    }, 1500);

    sendGameState(io, game);
    return;
  }

  if (result.gameOver) {
    game.phase = 'gameover';
    game.winner = result.gameOver.winner;
    game.winReason = result.gameOver.reason;
    io.to(roomCode).emit(S2C.GAME_OVER, result.gameOver);
  }

  sendGameState(io, game);
}

// ── Start server ─────────────────────────────────────────

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(server, {
    cors: { origin: '*' },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // ── CREATE ROOM ──────────────────────────────────────

    socket.on(C2S.CREATE_ROOM, (data?: { nickname?: string; theme?: string }) => {
      const roomCode = generateRoomCode();
      const game = createGameState(roomCode);

      game.players.push({
        id: socket.id,
        number: 1,
        ready: false,
        connected: true,
      });

      if (data?.nickname) game.players[0].nickname = data.nickname.slice(0, 20);

      games.set(roomCode, game);
      if (data?.theme) game.roomTheme = data.theme;
      socketToRoom.set(socket.id, roomCode);
      socket.join(roomCode);

      socket.emit(S2C.ROOM_CREATED, { roomCode, playerNumber: 1, theme: data?.theme });
      console.log(`Room ${roomCode} created by ${socket.id}`);
    });

    // ── CREATE BOT GAME ──────────────────────────────────

    socket.on(C2S.CREATE_BOT_GAME, (data?: { nickname?: string }) => {
      const roomCode = generateRoomCode();
      const game = createGameState(roomCode);

      // Add human player
      game.players.push({
        id: socket.id,
        number: 1,
        ready: false,
        connected: true,
      });
      if (data?.nickname) game.players[0].nickname = data.nickname.slice(0, 20);

      // Add bot player
      game.players.push({
        id: 'bot',
        number: 2,
        ready: false,
        connected: true,
        nickname: 'Bot',
      });

      game.phase = 'setup';
      games.set(roomCode, game);
      botGames.add(roomCode);
      botLastMoved.set(roomCode, null);
      socketToRoom.set(socket.id, roomCode);
      socket.join(roomCode);

      // Bot auto-places pieces and readies up
      const botPieces = botPlacePieces(2);
      game.setupPieces[2] = botPieces;
      game.players[1].ready = true;

      socket.emit(S2C.ROOM_JOINED, { roomCode, playerNumber: 1 });
      socket.emit(S2C.OPPONENT_READY);
      sendGameState(io, game);
      console.log(`Bot game ${roomCode} created by ${socket.id}`);
    });

    // ── JOIN ROOM ────────────────────────────────────────

    socket.on(C2S.JOIN_ROOM, (data: { roomCode: string; nickname?: string }) => {
      const code = data.roomCode.toUpperCase().trim();
      const game = games.get(code);

      if (!game) {
        socket.emit(S2C.ERROR, { message: 'Room not found' });
        return;
      }

      // Check for reconnection
      const disconnectedPlayer = game.players.find(
        p => !p.connected && p.number !== undefined
      );

      if (disconnectedPlayer) {
        // Reconnect
        const oldId = disconnectedPlayer.id;
        disconnectedPlayer.id = socket.id;
        disconnectedPlayer.connected = true;

        // Clear disconnect timer
        const timer = disconnectTimers.get(oldId);
        if (timer) {
          clearTimeout(timer);
          disconnectTimers.delete(oldId);
        }

        socketToRoom.set(socket.id, code);
        socket.join(code);

        socket.emit(S2C.ROOM_JOINED, {
          roomCode: code,
          playerNumber: disconnectedPlayer.number,
          theme: game.roomTheme,
        });

        // Notify opponent
        const opponent = game.players.find(p => p.number !== disconnectedPlayer.number);
        if (opponent && opponent.connected) {
          io.to(opponent.id).emit(S2C.OPPONENT_RECONNECTED);
        }

        sendGameState(io, game);
        console.log(`Player ${disconnectedPlayer.number} reconnected to ${code}`);
        return;
      }

      if (game.players.length >= 2) {
        socket.emit(S2C.ERROR, { message: 'Room is full' });
        return;
      }

      game.players.push({
        id: socket.id,
        number: 2,
        ready: false,
        connected: true,
      });
      if (data.nickname) game.players[game.players.length - 1].nickname = data.nickname.slice(0, 20);

      game.phase = 'setup';
      socketToRoom.set(socket.id, code);
      socket.join(code);

      socket.emit(S2C.ROOM_JOINED, { roomCode: code, playerNumber: 2, theme: game.roomTheme });

      // Notify player 1
      const p1 = game.players.find(p => p.number === 1);
      if (p1) {
        io.to(p1.id).emit(S2C.PLAYER_JOINED);
      }

      sendGameState(io, game);
      console.log(`Player 2 joined room ${code}`);
    });

    // ── PLACE PIECES ─────────────────────────────────────

    socket.on(C2S.PLACE_PIECES, (data: { pieces: PlacedPiece[] }) => {
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return;
      const game = games.get(roomCode);
      if (!game || game.phase !== 'setup') return;

      const player = game.players.find(p => p.id === socket.id);
      if (!player) return;

      const validation = validateSetup(data.pieces, player.number);
      if (!validation.valid) {
        socket.emit(S2C.ERROR, { message: validation.reason });
        return;
      }

      game.setupPieces[player.number] = data.pieces;
      sendGameState(io, game);
    });

    // ── PLAYER READY ─────────────────────────────────────

    socket.on(C2S.PLAYER_READY, () => {
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return;
      const game = games.get(roomCode);
      if (!game || game.phase !== 'setup') return;

      const player = game.players.find(p => p.id === socket.id);
      if (!player) return;

      // Validate pieces are placed
      const pieces = game.setupPieces[player.number];
      if (pieces.length !== 30) {
        socket.emit(S2C.ERROR, { message: 'Place all 30 pieces before readying up' });
        return;
      }

      player.ready = true;

      // Notify opponent
      const opponent = game.players.find(p => p.number !== player.number);
      if (opponent && opponent.connected) {
        io.to(opponent.id).emit(S2C.OPPONENT_READY);
      }

      // Check if both ready
      if (game.players.every(p => p.ready)) {
        // Place all pieces on board
        for (const p of game.setupPieces[1]) {
          game.board[p.row][p.col] = { ...p };
        }
        for (const p of game.setupPieces[2]) {
          game.board[p.row][p.col] = { ...p };
        }

        game.phase = 'playing';
        game.currentTurn = Math.random() < 0.5 ? 1 : 2;
        console.log(`Game ${roomCode} started!`);
      }

      sendGameState(io, game);

      // Emit coin flip result after game starts
      if (game.phase === 'playing' && game.players.every(p => p.ready)) {
        const p1 = game.players.find(p => p.number === 1);
        const p2 = game.players.find(p => p.number === 2);
        io.to(roomCode).emit('coin_flip', {
          player1Name: p1?.nickname || 'Player 1',
          player2Name: p2?.nickname || 'Player 2',
          winner: game.currentTurn,
        });

        // If bot game and bot goes first, wait for coin flip animation (4.5s) before bot moves
        if (botGames.has(roomCode) && game.currentTurn === 2) {
          setTimeout(() => executeBotTurn(io, roomCode), 4500);
        }
      }
    });

    // ── MAKE MOVE ────────────────────────────────────────

    socket.on(C2S.MAKE_MOVE, (data: { from: Square; to: Square }) => {
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return;
      const game = games.get(roomCode);
      if (!game || game.phase !== 'playing') return;

      const player = game.players.find(p => p.id === socket.id);
      if (!player || player.number !== game.currentTurn) {
        socket.emit(S2C.INVALID_MOVE, { message: 'Not your turn' });
        return;
      }

      if (game.awaitingSpotter) {
        socket.emit(S2C.INVALID_MOVE, { message: 'Awaiting spotter prediction' });
        return;
      }

      const result = executeMove(game, data.from, data.to, player.number);

      if (!result.success) {
        socket.emit(S2C.INVALID_MOVE, { message: 'Invalid move' });
        return;
      }

      // Send reveal event if applicable
      if (result.reveal) {
        io.to(roomCode).emit(S2C.REVEAL_EVENT, result.reveal);
      }

      // Handle spotter prompt
      if (result.spotterPrompt) {
        game.awaitingSpotter = true;
        socket.emit(S2C.SPOTTER_PROMPT, result.spotterPrompt);
        // Update state for client to show prompt
        const clientState = createClientGameState(game, player.number);
        clientState.awaitingSpotter = result.spotterPrompt;
        socket.emit(S2C.GAME_STATE, clientState);

        // Send opponent their view
        const opponent = game.players.find(p => p.number !== player.number);
        if (opponent && opponent.connected) {
          // Reveal the spotter to the opponent
          const opponentReveal: RevealEvent = {
            type: 'spotter_reveal',
            pieces: [{
              position: result.spotterPrompt.spotterPosition,
              rank: '1',
              name: 'Spotter',
              owner: player.number,
            }],
            duration: 3000,
          };
          io.to(opponent.id).emit(S2C.REVEAL_EVENT, opponentReveal);
          io.to(opponent.id).emit(S2C.GAME_STATE, createClientGameState(game, opponent.number));
        }
        return;
      }

      // Send game over if applicable
      if (result.gameOver) {
        game.phase = 'gameover';
        game.winner = result.gameOver.winner;
        game.winReason = result.gameOver.reason;
        io.to(roomCode).emit(S2C.GAME_OVER, result.gameOver);
      }

      sendGameState(io, game);

      // Trigger bot turn after a delay
      if (!result.gameOver && botGames.has(roomCode) && game.currentTurn === 2) {
        const delay = result.reveal ? result.reveal.duration + 1000 : 800;
        setTimeout(() => executeBotTurn(io, roomCode), delay);
      }
    });

    // ── SPOTTER PREDICTION ───────────────────────────────

    socket.on(C2S.SPOTTER_PREDICT, (data: {
      spotterPosition: Square;
      targetPosition: Square;
      predictedRank: Rank;
    }) => {
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return;
      const game = games.get(roomCode);
      if (!game || game.phase !== 'playing') return;

      const player = game.players.find(p => p.id === socket.id);
      if (!player) return;

      // Verify it's the player's turn
      if (player.number !== game.currentTurn) {
        socket.emit(S2C.ERROR, { message: 'Not your turn' });
        return;
      }

      // Verify spotter piece is owned by the player
      const spotterPiece = game.board[data.spotterPosition.row]?.[data.spotterPosition.col];
      if (!spotterPiece || spotterPiece.owner !== player.number || spotterPiece.rank !== '1') {
        socket.emit(S2C.ERROR, { message: 'Invalid spotter piece' });
        return;
      }

      // Clear awaitingSpotter flag
      game.awaitingSpotter = false;

      const result = resolveSpotterPrediction(
        data.spotterPosition,
        data.targetPosition,
        data.predictedRank,
        game.board
      );

      if (!result) {
        socket.emit(S2C.ERROR, { message: 'Invalid spotter prediction' });
        return;
      }

      // Add to move log
      const logEntry = game.moveLog[game.moveLog.length - 1];
      if (logEntry) {
        logEntry.spotter = {
          correct: result.correct,
          predictedRank: data.predictedRank,
          targetName: result.targetPiece.name,
          targetRank: result.targetPiece.rank,
        };
      }

      // If correct, destroy the target
      if (result.correct) {
        const target = game.board[data.targetPosition.row][data.targetPosition.col];
        if (target) {
          game.capturedPieces[target.owner].push(target);
          game.board[data.targetPosition.row][data.targetPosition.col] = null;
        }
      }

      // Send result to both players
      const spotterReveal: RevealEvent = {
        type: 'spotter_reveal',
        pieces: [
          {
            position: data.spotterPosition,
            rank: '1',
            name: 'Spotter',
            owner: player.number,
          },
          {
            position: data.targetPosition,
            rank: result.targetPiece.rank,
            name: result.targetPiece.name,
            owner: result.targetPiece.owner,
          },
        ],
        spotterResult: result,
        duration: 2000,
      };

      io.to(roomCode).emit(S2C.REVEAL_EVENT, spotterReveal);
      io.to(roomCode).emit(S2C.SPOTTER_RESULT, {
        correct: result.correct,
        targetRank: result.targetPiece.rank,
        targetName: result.targetPiece.name,
      });

      // Switch turn
      game.currentTurn = player.number === 1 ? 2 : 1;

      // Check if opponent has no movable pieces
      const opponent: PlayerNumber = player.number === 1 ? 2 : 1;
      if (checkNoMovablePieces(opponent, game.board)) {
        game.phase = 'gameover';
        game.winner = player.number;
        game.winReason = `Player ${opponent} has no movable pieces!`;
        io.to(roomCode).emit(S2C.GAME_OVER, {
          winner: player.number,
          reason: game.winReason,
        });
      }

      setTimeout(() => {
        sendGameState(io, game);

        // Trigger bot turn after spotter resolution
        if (game.phase === 'playing' && botGames.has(roomCode) && game.currentTurn === 2) {
          setTimeout(() => executeBotTurn(io, roomCode), 800);
        }
      }, 2000);
    });

    // ── SET NICKNAME ─────────────────────────────────────

    socket.on(C2S.SET_NICKNAME, (data: { nickname: string }) => {
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return;
      const game = games.get(roomCode);
      if (!game) return;

      const player = game.players.find(p => p.id === socket.id);
      if (player) {
        player.nickname = data.nickname.slice(0, 20);
        sendGameState(io, game);
      }
    });

    // ── PLAY AGAIN ───────────────────────────────────────

    socket.on(C2S.PLAY_AGAIN, () => {
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return;
      const game = games.get(roomCode);
      if (!game) return;

      // Reset game
      game.phase = 'setup';
      game.board = createEmptyBoard();
      game.currentTurn = 1;
      game.moveLog = [];
      game.capturedPieces = { 1: [], 2: [] };
      game.winner = undefined;
      game.winReason = undefined;
      game.setupPieces = { 1: [], 2: [] };
      game.players.forEach(p => { p.ready = false; });

      // Re-setup bot if this is a bot game
      if (botGames.has(roomCode)) {
        const botPieces = botPlacePieces(2);
        game.setupPieces[2] = botPieces;
        const botPlayer = game.players.find(p => p.number === 2);
        if (botPlayer) botPlayer.ready = true;
        botLastMoved.set(roomCode, null);
        socket.emit(S2C.OPPONENT_READY);
      }

      sendGameState(io, game);
    });

    // ── DISCONNECT ───────────────────────────────────────

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) return;

      const game = games.get(roomCode);
      if (!game) return;

      const player = game.players.find(p => p.id === socket.id);
      if (!player) return;

      player.connected = false;
      player.disconnectedAt = Date.now();

      // Bot games: clean up after 60s (same as multiplayer)
      if (botGames.has(roomCode)) {
        const botTimer = setTimeout(() => {
          if (!player.connected) {
            games.delete(roomCode);
            botGames.delete(roomCode);
            botLastMoved.delete(roomCode);
            console.log(`Bot game ${roomCode} deleted (player disconnected)`);
          }
          disconnectTimers.delete(socket.id);
        }, 60000);
        disconnectTimers.set(socket.id, botTimer);
        socketToRoom.delete(socket.id);
        return;
      }

      // Notify opponent
      const opponent = game.players.find(p => p.number !== player.number);
      if (opponent && opponent.connected) {
        io.to(opponent.id).emit(S2C.OPPONENT_DISCONNECTED);
      }

      // Set 60-second cleanup timer
      const timer = setTimeout(() => {
        // If still disconnected after 60s, end the game
        if (!player.connected) {
          if (game.phase === 'playing') {
            game.phase = 'gameover';
            const opponentNum = player.number === 1 ? 2 : 1;
            game.winner = opponentNum as PlayerNumber;
            game.winReason = `Player ${player.number} disconnected`;
            sendGameState(io, game);
          }

          // Clean up if both disconnected
          if (game.players.every(p => !p.connected)) {
            games.delete(roomCode);
            console.log(`Room ${roomCode} deleted (all disconnected)`);
          }
        }
        disconnectTimers.delete(socket.id);
      }, 60000);

      disconnectTimers.set(socket.id, timer);
      socketToRoom.delete(socket.id);
    });
  });

  server.listen(port, () => {
    console.log(`> Stratego server ready on http://${hostname}:${port}`);
  });
});
