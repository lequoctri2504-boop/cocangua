import { useEffect } from 'react';
import { socket } from './socket';
import { useStore } from './store';
import Lobby from './Lobby';
import Game from './Game';

function App() {
  const gameState = useStore((state) => state.gameState);
  const setRoomInfo = useStore((state) => state.setRoomInfo);
  const updatePlayers = useStore((state) => state.updatePlayers);
  const setGameStarted = useStore((state) => state.setGameStarted);
  const setDiceResult = useStore((state) => state.setDiceResult);
  const updateBoard = useStore((state) => state.updateBoard);
  const setWinner = useStore((state) => state.setWinner);
  const addMessage = useStore((state) => state.addMessage);
  const setTurn = useStore((state) => state.setTurn);
  const reset = useStore((state) => state.reset);

  useEffect(() => {
    socket.connect();
    
    socket.on('connect', () => {
      setRoomInfo({ myId: socket.id });
    });

    socket.on('room_created', (data) => {
      setRoomInfo({ roomCode: data.code, players: data.players, hostId: data.hostId, maxPlayers: data.maxPlayers });
    });

    socket.on('room_joined', (data) => {
      setRoomInfo({ roomCode: data.code, players: data.room.players, hostId: data.room.hostId, maxPlayers: data.room.maxPlayers });
    });

    socket.on('player_joined', (data) => {
      updatePlayers(data.players);
    });

    socket.on('player_left', (data) => {
      updatePlayers(data.players);
    });
    
    socket.on('host_changed', (data) => {
      setRoomInfo({ hostId: data.newHostId });
    });

    socket.on('game_started', (data) => {
      setGameStarted(data.board, data.turn, data.players);
    });

    socket.on('turn_changed', (data) => {
       setTurn(data.turn);
    });

    socket.on('dice_result', (data) => {
      setDiceResult(data.value, data.movable);
    });

    socket.on('board_updated', (data) => {
      updateBoard(data.board, data.nextTurn);
    });

    socket.on('game_over', (data) => {
      setWinner(data.winner);
    });

    socket.on('chat_message', (data) => {
      addMessage(data);
    });

    socket.on('error', (data) => {
      alert(data.message);
    });

    socket.on('disconnect', () => {
      reset();
    });

    return () => {
      socket.off('connect');
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('host_changed');
      socket.off('game_started');
      socket.off('turn_changed');
      socket.off('dice_result');
      socket.off('board_updated');
      socket.off('game_over');
      socket.off('chat_message');
      socket.off('error');
      socket.off('disconnect');
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex items-center justify-center">
      {gameState === 'lobby' ? <Lobby /> : <Game />}
    </div>
  );
}

export default App;
