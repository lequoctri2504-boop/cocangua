import { socket } from './socket';

export default function Board({ board, players, movablePieces, onMove }) {
  if (!board) return null;

  const { cx, cy, R, cages, cells, homePaths } = board;

  const renderCells = () => {
    return cells.map((cell, idx) => (
      <circle 
        key={`cell-${idx}`} 
        cx={cell.x} 
        cy={cell.y} 
        r={10} 
        fill="rgba(255,255,255,0.1)" 
        stroke="rgba(255,255,255,0.3)" 
        strokeWidth={1} 
      />
    ));
  };

  const renderHomePaths = () => {
    return homePaths.map((path, pIdx) => {
      const color = players[pIdx] ? players[pIdx].color : 'gray';
      return path.map((cell, cIdx) => (
        <circle 
          key={`home-${pIdx}-${cIdx}`} 
          cx={cell.x} 
          cy={cell.y} 
          r={10} 
          fill="rgba(255,255,255,0.1)" 
          stroke={color} 
          strokeWidth={2} 
        />
      ));
    });
  };

  const renderCages = () => {
    return cages.map((cage, idx) => {
      const color = players[idx] ? players[idx].color : 'gray';
      return (
        <g key={`cage-${idx}`}>
          <circle cx={cage.x} cy={cage.y} r={40} fill="rgba(0,0,0,0.3)" stroke={color} strokeWidth={3} />
          {/* Cage piece slots */}
          {cage.pieces.map((pid, pIdx) => {
            const angle = (pIdx * 2 * Math.PI) / cage.pieces.length;
            const px = cage.x + 20 * Math.cos(angle);
            const py = cage.y + 20 * Math.sin(angle);
            return <circle key={`slot-${pid}`} cx={px} cy={py} r={12} fill="rgba(255,255,255,0.1)" />;
          })}
        </g>
      );
    });
  };

  const renderPieces = () => {
    return board.pieces.map(piece => {
      const player = players.find(p => p.id === piece.playerId);
      if (!player) return null;
      
      let x, y;
      
      if (piece.isFinished) {
         // place at center
         x = cx;
         y = cy;
      } else if (piece.position === -1) {
        // In cage
        const cage = cages[piece.playerIndex];
        const pIdx = cage.pieces.indexOf(piece.id);
        const angle = (pIdx * 2 * Math.PI) / cage.pieces.length;
        x = cage.x + 20 * Math.cos(angle);
        y = cage.y + 20 * Math.sin(angle);
      } else if (piece.homePathIndex !== -1) {
        // In home path
        const path = homePaths[piece.playerIndex];
        const cell = path[piece.homePathIndex];
        x = cell.x;
        y = cell.y;
      } else {
        // On board
        const cell = cells[piece.position];
        x = cell.x;
        y = cell.y;
      }

      const isMovable = movablePieces.includes(piece.id);

      return (
        <circle 
          key={piece.id}
          cx={x}
          cy={y}
          r={12}
          fill={player.color}
          className={`piece ${isMovable ? 'movable' : ''}`}
          onClick={() => isMovable && onMove(piece.id)}
          stroke="rgba(0,0,0,0.5)"
          strokeWidth={2}
          style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      );
    });
  };

  return (
    <svg width="600" height="600" viewBox="0 0 600 600" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '50%', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }}>
      {/* Center finish line */}
      <circle cx={cx} cy={cy} r={30} fill="rgba(255,255,255,0.1)" stroke="white" strokeWidth={2} />
      
      {renderCages()}
      {renderCells()}
      {renderHomePaths()}
      {renderPieces()}
    </svg>
  );
}
