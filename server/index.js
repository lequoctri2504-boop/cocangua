const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const roomManager = require('./roomManager');

const app = express();
app.use(cors());

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create_room', (data) => {
    const { name, maxPlayers } = data;
    const roomCode = roomManager.createRoom(maxPlayers, socket.id, name);
    socket.join(roomCode);
    const room = roomManager.getRoom(roomCode);
    socket.emit('room_created', { code: roomCode, players: room.players, hostId: room.hostId, maxPlayers });
    io.to(roomCode).emit('player_joined', { players: room.players });
  });

  socket.on('join_room', (data) => {
    const { code, name } = data;
    const roomCode = code.toUpperCase();
    const result = roomManager.joinRoom(roomCode, socket.id, name);
    
    if (result.success) {
      socket.join(roomCode);
      const room = roomManager.getRoom(roomCode);
      socket.emit('room_joined', { code: roomCode, room: room });
      io.to(roomCode).emit('player_joined', { players: room.players });
    } else {
      socket.emit('error', { message: result.error });
    }
  });

  socket.on('start_game', () => {
    const roomCode = roomManager.getRoomCodeByPlayerId(socket.id);
    if (!roomCode) return;
    
    const room = roomManager.getRoom(roomCode);
    if (room && room.hostId === socket.id && room.players.length >= 2) {
      const started = roomManager.startGame(roomCode);
      if (started) {
        io.to(roomCode).emit('game_started', { 
          board: room.board, 
          turn: room.currentTurn,
          players: room.players
        });
      }
    }
  });

  socket.on('roll_dice', () => {
    const roomCode = roomManager.getRoomCodeByPlayerId(socket.id);
    if (!roomCode) return;
    
    const result = roomManager.rollDice(roomCode, socket.id);
    if (result.success) {
      io.to(roomCode).emit('dice_result', { 
        value: result.value, 
        movable: result.movable,
        playerId: socket.id
      });
    }
  });

  socket.on('move_piece', (data) => {
    const { pieceId } = data;
    const roomCode = roomManager.getRoomCodeByPlayerId(socket.id);
    if (!roomCode) return;

    const result = roomManager.movePiece(roomCode, socket.id, pieceId);
    if (result.success) {
      io.to(roomCode).emit('board_updated', { 
        board: result.board, 
        nextTurn: result.nextTurn 
      });

      if (result.winner) {
        io.to(roomCode).emit('game_over', { winner: result.winner });
      }
    }
  });

  socket.on('chat_message', (data) => {
     const roomCode = roomManager.getRoomCodeByPlayerId(socket.id);
     if (roomCode) {
        io.to(roomCode).emit('chat_message', {
           playerId: socket.id,
           message: data.message,
           name: data.name
        });
     }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const result = roomManager.leaveRoom(socket.id);
    if (result && result.roomCode) {
      io.to(result.roomCode).emit('player_left', { players: result.players });
      if (result.hostChanged) {
         io.to(result.roomCode).emit('host_changed', { newHostId: result.newHostId });
      }
    }
  });
});

roomManager.setIo(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
