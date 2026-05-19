let io = null;
let roomManager = null;
const timers = new Map();

function setIo(socketIo) {
  io = socketIo;
}

function setRoomManager(rm) {
  roomManager = rm;
}

function startTurn(roomCode, playerId) {
  clearTurn(roomCode);
  const timer = setTimeout(() => {
    if (roomManager) {
      roomManager.nextTurn(roomCode);
    }
  }, 30000); // 30 seconds
  timers.set(roomCode, timer);
}

function clearTurn(roomCode) {
  if (timers.has(roomCode)) {
    clearTimeout(timers.get(roomCode));
    timers.delete(roomCode);
  }
}

module.exports = {
  setIo,
  setRoomManager,
  startTurn,
  clearTurn
};
