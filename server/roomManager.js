const { generateBoard, getMovable, executeMove } = require('./gameEngine');
const turnManager = require('./turnManager');

const rooms = new Map();
const playerRoomMap = new Map();
let io = null;

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316', '#ec4899', '#14b8a6', '#64748b', '#84cc16'];

function setIo(socketIo) {
  io = socketIo;
  turnManager.setIo(socketIo);
  turnManager.setRoomManager(module.exports);
}

function createRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createRoom(maxPlayers, hostId, hostName) {
  const code = createRoomCode();
  const player = {
    id: hostId,
    name: hostName,
    color: COLORS[0],
    pieces: []
  };
  
  rooms.set(code, {
    code,
    hostId,
    maxPlayers: parseInt(maxPlayers),
    players: [player],
    status: 'waiting', 
    board: null,
    currentTurn: null,
    turnIndex: 0,
    diceValue: null,
    movablePieces: []
  });
  
  playerRoomMap.set(hostId, code);
  return code;
}

function joinRoom(code, playerId, playerName) {
  const room = rooms.get(code);
  if (!room) return { success: false, error: 'Room not found' };
  if (room.status !== 'waiting') return { success: false, error: 'Game already started' };
  if (room.players.length >= room.maxPlayers) return { success: false, error: 'Room is full' };
  
  const player = {
    id: playerId,
    name: playerName,
    color: COLORS[room.players.length],
    pieces: []
  };
  
  room.players.push(player);
  playerRoomMap.set(playerId, code);
  return { success: true };
}

function leaveRoom(playerId) {
  const code = playerRoomMap.get(playerId);
  if (!code) return null;
  
  const room = rooms.get(code);
  if (!room) return null;
  
  playerRoomMap.delete(playerId);
  room.players = room.players.filter(p => p.id !== playerId);
  
  if (room.players.length === 0) {
    rooms.delete(code);
    return { roomEmpty: true };
  }
  
  let hostChanged = false;
  let newHostId = null;
  if (room.hostId === playerId) {
    room.hostId = room.players[0].id;
    newHostId = room.hostId;
    hostChanged = true;
  }
  
  if (room.status === 'playing' && room.currentTurn === playerId) {
     nextTurn(code);
  }
  
  return { roomCode: code, players: room.players, hostChanged, newHostId };
}

function getRoom(code) {
  return rooms.get(code);
}

function getRoomCodeByPlayerId(playerId) {
  return playerRoomMap.get(playerId);
}

function startGame(code) {
  const room = rooms.get(code);
  if (!room || room.players.length < 2) return false;
  
  room.status = 'playing';
  room.board = generateBoard(room.players.length);
  
  room.players.forEach((p, i) => {
    p.pieces = room.board.cages[i].pieces.map(pid => ({
      id: pid,
      playerId: p.id,
      position: -1, 
      isFinished: false,
      homePathIndex: -1,
      playerIndex: i
    }));
    room.board.pieces.push(...p.pieces);
  });
  
  room.turnIndex = 0;
  room.currentTurn = room.players[0].id;
  room.diceValue = null;
  room.movablePieces = [];
  
  turnManager.startTurn(code, room.currentTurn);
  return true;
}

function nextTurn(code) {
  const room = rooms.get(code);
  if (!room) return;
  
  room.diceValue = null;
  room.movablePieces = [];
  
  // if dice was 6, player gets another turn, unless we just want simple rules. Let's make it simple for now: always next turn unless 6.
  // Actually, wait, let's keep it simple: next turn always.
  room.turnIndex = (room.turnIndex + 1) % room.players.length;
  room.currentTurn = room.players[room.turnIndex].id;
  
  io.to(code).emit('turn_changed', { turn: room.currentTurn });
  turnManager.startTurn(code, room.currentTurn);
}

function rollDice(code, playerId) {
  const room = rooms.get(code);
  if (!room || room.currentTurn !== playerId || room.diceValue !== null) return { success: false };
  
  room.diceValue = Math.floor(Math.random() * 6) + 1;
  const player = room.players.find(p => p.id === playerId);
  
  const playerIndex = room.players.findIndex(p => p.id === playerId);
  room.movablePieces = getMovable(room.board, playerIndex, room.diceValue);
  
  if (room.movablePieces.length === 0) {
    setTimeout(() => nextTurn(code), 2000);
  } else {
    turnManager.startTurn(code, playerId); // reset timer
  }
  
  return { success: true, value: room.diceValue, movable: room.movablePieces };
}

function movePiece(code, playerId, pieceId) {
  const room = rooms.get(code);
  if (!room || room.currentTurn !== playerId || room.diceValue === null) return { success: false };
  
  if (!room.movablePieces.includes(pieceId)) return { success: false };
  
  const playerIndex = room.players.findIndex(p => p.id === playerId);
  executeMove(room.board, playerIndex, pieceId, room.diceValue);
  
  // Check win condition
  const player = room.players[playerIndex];
  const playerPieces = room.board.pieces.filter(p => p.playerIndex === playerIndex);
  const isWinner = playerPieces.every(p => p.isFinished);
  
  let winner = null;
  if (isWinner) {
    room.status = 'finished';
    winner = player;
    turnManager.clearTurn(code);
  } else {
    if (room.diceValue === 6) {
      room.diceValue = null;
      room.movablePieces = [];
      io.to(code).emit('turn_changed', { turn: room.currentTurn });
      turnManager.startTurn(code, room.currentTurn);
    } else {
      nextTurn(code);
    }
  }
  
  return { success: true, board: room.board, nextTurn: room.currentTurn, winner };
}

module.exports = {
  setIo,
  createRoom,
  joinRoom,
  leaveRoom,
  getRoom,
  getRoomCodeByPlayerId,
  startGame,
  rollDice,
  movePiece,
  nextTurn
};
