import { useState } from 'react';
import { socket } from './socket';
import { useStore } from './store';

export default function Lobby() {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(2);
  const { roomCode, players, hostId, myId } = useStore();

  const handleCreate = () => {
    if (!name) return alert('Enter your name');
    socket.emit('create_room', { name, maxPlayers });
  };

  const handleJoin = () => {
    if (!name) return alert('Enter your name');
    if (!joinCode) return alert('Enter room code');
    socket.emit('join_room', { code: joinCode, name });
  };

  const handleStart = () => {
    socket.emit('start_game');
  };

  if (roomCode) {
    return (
      <div className="lobby-container glass-panel">
        <h1 className="title">Room: {roomCode}</h1>
        <div className="players-list">
          <h2>Players ({players.length}/{useStore.getState().maxPlayers})</h2>
          <ul>
            {players.map((p) => (
              <li key={p.id} style={{ color: p.color }}>
                {p.name} {p.id === hostId ? '(Host)' : ''} {p.id === myId ? '(You)' : ''}
              </li>
            ))}
          </ul>
        </div>
        {myId === hostId && players.length >= 2 && (
          <button className="btn primary animate-pulse" onClick={handleStart}>
            Start Game
          </button>
        )}
        {myId === hostId && players.length < 2 && (
          <p className="waiting-msg">Waiting for more players...</p>
        )}
      </div>
    );
  }

  return (
    <div className="lobby-container glass-panel">
      <h1 className="title gradient-text">Ludo Universe</h1>
      
      <div className="input-group">
        <label>Your Name</label>
        <input 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Enter name..."
          className="input"
        />
      </div>

      <div className="lobby-actions">
        <div className="card">
          <h3>Create Room</h3>
          <div className="input-group">
            <label>Players: {maxPlayers}</label>
            <input 
              type="range" 
              min="2" max="10" 
              value={maxPlayers} 
              onChange={(e) => setMaxPlayers(e.target.value)}
              className="range-input"
            />
          </div>
          <button className="btn primary" onClick={handleCreate}>Create Room</button>
        </div>

        <div className="divider">OR</div>

        <div className="card">
          <h3>Join Room</h3>
          <div className="input-group">
            <input 
              type="text" 
              value={joinCode} 
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())} 
              placeholder="Room Code"
              className="input uppercase"
            />
          </div>
          <button className="btn secondary" onClick={handleJoin}>Join Room</button>
        </div>
      </div>
    </div>
  );
}
