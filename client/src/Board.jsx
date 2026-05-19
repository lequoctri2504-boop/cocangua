import { socket } from './socket';

export default function Board({ board, players, movablePieces, onMove }) {
  if (!board) return null;

  const { cx, cy, cages, cells, homePaths } = board;

  const renderCells = () => {
    return cells.map((cell, idx) => {
      if (board.isClassic4) {
        return (
          <circle 
            key={`cell-${idx}`} 
            cx={cell.x} 
            cy={cell.y} 
            r={board.cellSize/2 - 3} 
            fill="rgba(255,255,255,0.85)" 
            stroke="rgba(0,0,0,0.3)" 
            strokeWidth={2} 
          />
        );
      } else {
        return (
          <circle 
            key={`cell-${idx}`} 
            cx={cell.x} 
            cy={cell.y} 
            r={10} 
            fill="rgba(255,255,255,0.1)" 
            stroke="rgba(255,255,255,0.3)" 
            strokeWidth={1} 
          />
        );
      }
    });
  };

  const renderHomePaths = () => {
    return homePaths.map((path, pIdx) => {
      const color = players[pIdx] ? players[pIdx].color : 'gray';
      return path.map((cell, cIdx) => {
        if (board.isClassic4) {
          return (
            <g key={`home-${pIdx}-${cIdx}`}>
              <rect 
                x={cell.x - board.cellSize/2 + 2} 
                y={cell.y - board.cellSize/2 + 2} 
                width={board.cellSize - 4} 
                height={board.cellSize - 4} 
                fill={color} 
                stroke="white" 
                strokeWidth={2} 
                rx={6}
              />
              <text x={cell.x} y={cell.y + 6} fontSize="16" fontWeight="bold" fill="white" textAnchor="middle">
                {cIdx + 1}
              </text>
            </g>
          );
        } else {
          return (
            <circle 
              key={`home-${pIdx}-${cIdx}`} 
              cx={cell.x} 
              cy={cell.y} 
              r={10} 
              fill="rgba(255,255,255,0.1)" 
              stroke={color} 
              strokeWidth={2} 
            />
          );
        }
      });
    });
  };

  const renderCages = () => {
    return cages.map((cage, idx) => {
      const color = players[idx] ? players[idx].color : 'gray';
      if (board.isClassic4) {
        return (
          <g key={`cage-${idx}`}>
            <rect x={cage.x - 100} y={cage.y - 100} width={200} height={200} fill="rgba(255,255,255,0.05)" stroke={color} strokeWidth={5} rx={16} />
            <circle cx={cage.x} cy={cage.y} r={60} fill="transparent" stroke={color} strokeWidth={8} opacity={0.6} />
            {cage.pieces.map((pid, pIdx) => {
              const px = cage.x + (pIdx % 2 === 0 ? -30 : 30);
              const py = cage.y + (pIdx < 2 ? -30 : 30);
              return <circle key={`slot-${pid}`} cx={px} cy={py} r={18} fill="rgba(255,255,255,0.1)" stroke={color} strokeWidth={2} />;
            })}
          </g>
        );
      } else {
        return (
          <g key={`cage-${idx}`}>
            <circle cx={cage.x} cy={cage.y} r={40} fill="rgba(0,0,0,0.3)" stroke={color} strokeWidth={3} />
            {cage.pieces.map((pid, pIdx) => {
              const angle = (pIdx * 2 * Math.PI) / cage.pieces.length;
              const px = cage.x + 20 * Math.cos(angle);
              const py = cage.y + 20 * Math.sin(angle);
              return <circle key={`slot-${pid}`} cx={px} cy={py} r={12} fill="rgba(255,255,255,0.1)" />;
            })}
          </g>
        );
      }
    });
  };

  const renderPieces = () => {
    return board.pieces.map(piece => {
      const player = players.find(p => p.id === piece.playerId);
      if (!player) return null;
      
      let x, y;
      
      if (piece.isFinished) {
         x = cx;
         y = cy;
      } else if (piece.position === -1) {
        const cage = cages[piece.playerIndex];
        const pIdx = cage.pieces.indexOf(piece.id);
        if (board.isClassic4) {
           x = cage.x + (pIdx % 2 === 0 ? -30 : 30);
           y = cage.y + (pIdx < 2 ? -30 : 30);
        } else {
           const angle = (pIdx * 2 * Math.PI) / cage.pieces.length;
           x = cage.x + 20 * Math.cos(angle);
           y = cage.y + 20 * Math.sin(angle);
        }
      } else if (piece.homePathIndex !== -1) {
        const path = homePaths[piece.playerIndex];
        const cell = path[piece.homePathIndex];
        x = cell.x;
        y = cell.y;
      } else {
        const cell = cells[piece.position];
        x = cell.x;
        y = cell.y;
      }

      const isMovable = movablePieces.includes(piece.id);

      return (
        <g 
          key={piece.id}
          transform={`translate(${x}, ${y})`} 
          style={{ transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', zIndex: isMovable ? 100 : 1 }}
        >
          <g
            className={`piece ${isMovable ? 'movable-horse' : ''}`}
            onClick={() => isMovable && onMove(piece.id)}
            style={{ cursor: isMovable ? 'pointer' : 'default' }}
          >
            <circle cx={0} cy={0} r={board.isClassic4 ? 18 : 16} fill={player.color} stroke="white" strokeWidth={3} filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.5))" />
            <text x={0} y={board.isClassic4 ? 6 : 5} fontSize={board.isClassic4 ? "20" : "18"} textAnchor="middle" fill="white">♞</text>
          </g>
        </g>
      );
    });
  };

  return (
    <div className="board-wrapper">
      <svg width="100%" height="auto" viewBox="0 0 600 600" style={{ background: board.isClassic4 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)', borderRadius: board.isClassic4 ? '16px' : '50%', boxShadow: '0 0 50px rgba(0,0,0,0.5)', overflow: 'visible' }}>
        {board.isClassic4 && (
          <rect x="0" y="0" width="600" height="600" fill="transparent" stroke="rgba(255,255,255,0.2)" strokeWidth={10} rx={16} />
        )}
        
        {/* Center finish area */}
        {board.isClassic4 ? (
           <rect x={cx - 60} y={cy - 60} width={120} height={120} fill="rgba(255,255,255,0.1)" stroke="white" strokeWidth={2} />
        ) : (
           <circle cx={cx} cy={cy} r={30} fill="rgba(255,255,255,0.1)" stroke="white" strokeWidth={2} />
        )}
        
        {renderCages()}
        {renderCells()}
        {renderHomePaths()}
        {renderPieces()}
      </svg>
    </div>
  );
}
