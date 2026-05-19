import { create } from 'zustand';

export const useStore = create((set) => ({
  gameState: 'lobby', // lobby, game
  roomCode: null,
  players: [],
  myId: null,
  hostId: null,
  maxPlayers: 2,
  board: null,
  currentTurn: null,
  diceValue: null,
  movablePieces: [],
  winner: null,
  messages: [],
  
  setGameState: (state) => set({ gameState: state }),
  setRoomInfo: (info) => set((state) => ({ ...state, ...info })),
  updatePlayers: (players) => set({ players }),
  setGameStarted: (board, turn, players) => set({ board, currentTurn: turn, gameState: 'game', players }),
  setDiceResult: (value, movable) => set({ diceValue: value, movablePieces: movable }),
  updateBoard: (board, nextTurn) => set({ board, currentTurn: nextTurn, diceValue: null, movablePieces: [] }),
  setWinner: (winner) => set({ winner }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setTurn: (turn) => set({ currentTurn: turn, diceValue: null, movablePieces: [] }),
  reset: () => set({
    gameState: 'lobby', roomCode: null, players: [], hostId: null,
    board: null, currentTurn: null, diceValue: null, movablePieces: [], winner: null, messages: []
  })
}));
