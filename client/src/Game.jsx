import { useState } from 'react';
import { socket } from './socket';
import { useStore } from './store';
import Board from './Board';
import { Dices, Send } from 'lucide-react';

export default function Game() {
  const { board, players, currentTurn, myId, diceValue, movablePieces, messages, winner, roomCode } = useStore();
  const [chatMsg, setChatMsg] = useState('');

  const isMyTurn = currentTurn === myId;
  const canRoll = isMyTurn && diceValue === null;

  const handleRoll = () => {
    if (!canRoll) return;
    socket.emit('roll_dice');
  };

  const handleMove = (pieceId) => {
    socket.emit('move_piece', { pieceId });
  };

  const handleChat = (e) => {
    e.preventDefault();
    if (!chatMsg.trim()) return;
    const me = players.find(p => p.id === myId);
    socket.emit('chat_message', { message: chatMsg, name: me.name });
    setChatMsg('');
  };

  if (winner) {
    return (
      <div className="glass-panel text-center">
        <h1 className="text-4xl font-bold mb-4 gradient-text">{winner.name} Wins!</h1>
        <button className="btn primary mt-4" onClick={() => window.location.reload()}>Play Again</button>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="board-area glass-panel">
        <Board 
          board={board} 
          players={players} 
          movablePieces={movablePieces}
          onMove={handleMove}
        />
      </div>

      <div className="sidebar">
        <div className="glass-panel p-4 dice-area">
          <div className="dice-result">
            {diceValue || '?'}
          </div>
          <button 
            className={`btn dice-btn flex items-center justify-center gap-2 ${canRoll ? 'primary animate-pulse' : 'secondary opacity-50 cursor-not-allowed'}`}
            onClick={handleRoll}
            disabled={!canRoll}
          >
            <Dices size={24} />
            <span className="font-bold text-lg">Roll Dice</span>
          </button>
          
          {isMyTurn && diceValue !== null && movablePieces.length === 0 && (
            <p className="text-red-400 text-sm text-center font-bold">No valid moves. Passing turn...</p>
          )}
        </div>

        <div className="glass-panel p-4 players-panel">
          <h2 className="font-bold mb-4 border-b border-gray-600 pb-2">Room: {roomCode}</h2>
          <div className="flex flex-col gap-2">
            {players.map(p => (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded transition-colors" style={{ background: currentTurn === p.id ? 'rgba(255,255,255,0.2)' : 'transparent', border: currentTurn === p.id ? `1px solid ${p.color}` : '1px solid transparent' }}>
                <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: p.color, boxShadow: `0 0 10px ${p.color}` }}></div>
                <span className={currentTurn === p.id ? 'font-bold' : ''}>{p.name} {p.id === myId ? '(You)' : ''}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-area glass-panel">
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className="chat-msg">
                <span style={{ color: players.find(p => p.id === m.playerId)?.color || 'white' }}>{m.name}: </span>
                {m.message}
              </div>
            ))}
          </div>
          <form className="chat-input" onSubmit={handleChat}>
            <input 
              type="text" 
              value={chatMsg}
              onChange={(e) => setChatMsg(e.target.value)}
              placeholder="Type message..." 
            />
            <button type="submit" className="send-btn bg-blue-600 rounded hover:bg-blue-700 transition">
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
