function generateBoard(n) {
  const cx = 300;
  const cy = 300;
  let R = 240;
  
  const cages = [];
  const cells = [];
  const homePaths = [];
  
  let cellsPerSegment = 13;
  if (n === 2) {
    cellsPerSegment = 18;
    // For 2 players, make it visually like a stretched circle (ellipse)
  }
  
  const totalCells = n * cellsPerSegment;
  
  for (let i = 0; i < n; i++) {
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
    const nextAngle = ((i + 1) * 2 * Math.PI) / n - Math.PI / 2;
    
    const x = cx + R * Math.cos(angle);
    const y = cy + R * Math.sin(angle);
    
    const nx = cx + R * Math.cos(nextAngle);
    const ny = cy + R * Math.sin(nextAngle);
    
    let numPieces = 4;
    if (n >= 5 && n <= 7) numPieces = 3;
    if (n >= 8) numPieces = 2;
    
    const pieces = [];
    for (let p = 0; p < numPieces; p++) {
       pieces.push(`p_${i}_${p}`);
    }
    
    cages.push({ playerIndex: i, x, y, pieces });
    
    // Path cells for this segment
    // We want the path to bulge out a bit, but straight line interpolation is fine for a simple multi-polygon
    for (let j = 0; j < cellsPerSegment; j++) {
      const t = j / cellsPerSegment;
      const cellX = x + t * (nx - x);
      const cellY = y + t * (ny - y);
      cells.push({ x: cellX, y: cellY });
    }
  }
  
  // Home paths: from the edge towards the center
  for (let i = 0; i < n; i++) {
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
    const hPath = [];
    for (let k = 1; k <= 5; k++) {
      const h_x = cx + (R - k * 35) * Math.cos(angle);
      const h_y = cy + (R - k * 35) * Math.sin(angle);
      hPath.push({ x: h_x, y: h_y });
    }
    homePaths.push(hPath);
  }
  
  return {
    cx, cy, R,
    cages,
    cells,
    homePaths,
    pieces: [], 
    totalCells,
    cellsPerSegment
  };
}

function getMovable(board, playerIndex, diceValue) {
  const movable = [];
  const startIndex = playerIndex * board.cellsPerSegment;
  
  const playerPieces = board.pieces.filter(p => p.playerIndex === playerIndex);
  
  playerPieces.forEach(piece => {
    if (piece.isFinished) return;
    
    if (piece.position === -1) {
      // In cage, need 6 to move out (in many rules 6 is needed, sometimes 1 or 6)
      // Let's assume 6 is needed to move out
      if (diceValue === 6) {
        // Check if start position is occupied by same player
        const pieceAtStart = board.pieces.find(p => p.position === startIndex && p.playerIndex === playerIndex);
        if (!pieceAtStart) {
          movable.push(piece.id);
        }
      }
    } else if (piece.homePathIndex !== -1) {
      // In home path
      if (piece.homePathIndex + diceValue <= 5) { // 5 is the finish line
        // check if blocked
        let blocked = false;
        for (let i = 1; i <= diceValue; i++) {
          const targetPathIndex = piece.homePathIndex + i;
          if (targetPathIndex < 5 && board.pieces.find(p => p.playerIndex === playerIndex && p.homePathIndex === targetPathIndex)) {
            blocked = true;
          }
        }
        if (!blocked) movable.push(piece.id);
      }
    } else {
      // On main board
      // Player finishes at (startIndex - 1) mod totalCells
      let finishCell = startIndex - 1;
      if (finishCell < 0) finishCell += board.totalCells;
      
      let distanceToFinish = finishCell - piece.position;
      if (distanceToFinish < 0) distanceToFinish += board.totalCells;
      
      if (distanceToFinish === 0) {
        // Already at finish cell, moving into home path
        if (diceValue <= 5) movable.push(piece.id);
      } else if (diceValue > distanceToFinish) {
        // Moving into home path
        const remaining = diceValue - distanceToFinish;
        if (remaining <= 5) {
          movable.push(piece.id);
        }
      } else {
        // Normal move
        movable.push(piece.id);
      }
    }
  });
  
  return movable;
}

function executeMove(board, playerIndex, pieceId, diceValue) {
  const piece = board.pieces.find(p => p.id === pieceId);
  if (!piece) return;
  
  const startIndex = playerIndex * board.cellsPerSegment;
  
  if (piece.position === -1) {
    piece.position = startIndex;
  } else if (piece.homePathIndex !== -1) {
    piece.homePathIndex += diceValue;
    if (piece.homePathIndex === 5) {
      piece.isFinished = true;
    }
  } else {
    let finishCell = startIndex - 1;
    if (finishCell < 0) finishCell += board.totalCells;
    
    let distanceToFinish = finishCell - piece.position;
    if (distanceToFinish < 0) distanceToFinish += board.totalCells;
    
    if (diceValue > distanceToFinish) {
      // Move into home path
      piece.position = -2; // Not on main board anymore
      piece.homePathIndex = diceValue - distanceToFinish - 1;
      if (piece.homePathIndex === 5) { // exactly reaches center?
        piece.isFinished = true;
      }
    } else {
      // Normal move on main board
      piece.position = (piece.position + diceValue) % board.totalCells;
      
      // Check capture
      const targetPiece = board.pieces.find(p => p.position === piece.position && p.id !== piece.id);
      if (targetPiece && targetPiece.playerIndex !== playerIndex) {
        // Capture! Send back to cage
        targetPiece.position = -1;
      }
    }
  }
}

module.exports = {
  generateBoard,
  getMovable,
  executeMove
};
