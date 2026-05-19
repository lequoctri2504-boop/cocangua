function generateBoard(n) {
  const cx = 300;
  const cy = 300;
  let R = 240;
  
  const cages = [];
  const cells = [];
  const homePaths = [];
  
  if (n === 4) {
    // Classic Ludo 15x15 Grid Layout (52 path cells)
    const cellSize = 600 / 15; // 40
    const offset = cellSize / 2;
    
    // Helper to get exact x, y
    const getPos = (col, row) => ({ x: col * cellSize + offset, y: row * cellSize + offset });
    
    const totalCells = 52;
    const cellsPerSegment = 13;
    
    // Players: 0: Bottom(Blue), 1: Left(Yellow), 2: Top(Red), 3: Right(Green)
    // Actually let's map: 0: Bottom, 1: Left, 2: Top, 3: Right
    
    // Cages
    // 0: Bottom Right
    cages.push({ playerIndex: 0, x: 12*cellSize, y: 12*cellSize, pieces: ['p_0_0','p_0_1','p_0_2','p_0_3'] });
    // 1: Bottom Left
    cages.push({ playerIndex: 1, x: 3*cellSize, y: 12*cellSize, pieces: ['p_1_0','p_1_1','p_1_2','p_1_3'] });
    // 2: Top Left
    cages.push({ playerIndex: 2, x: 3*cellSize, y: 3*cellSize, pieces: ['p_2_0','p_2_1','p_2_2','p_2_3'] });
    // 3: Top Right
    cages.push({ playerIndex: 3, x: 12*cellSize, y: 3*cellSize, pieces: ['p_3_0','p_3_1','p_3_2','p_3_3'] });
    
    // Main Path (52 cells)
    // Starting from bottom player (0) start cell: col 8, row 13
    const pathCoords = [
      // Bottom arm right side (UP)
      [8,13], [8,12], [8,11], [8,10], [8,9],
      // Right arm bottom side (RIGHT)
      [9,8], [10,8], [11,8], [12,8], [13,8], [14,8],
      // Right arm end (UP)
      [14,7],
      // Right arm top side (LEFT)
      [14,6], [13,6], [12,6], [11,6], [10,6], [9,6],
      // Top arm right side (UP)
      [8,5], [8,4], [8,3], [8,2], [8,1], [8,0],
      // Top arm end (LEFT)
      [7,0],
      // Top arm left side (DOWN)
      [6,0], [6,1], [6,2], [6,3], [6,4], [6,5],
      // Left arm top side (LEFT)
      [5,6], [4,6], [3,6], [2,6], [1,6], [0,6],
      // Left arm end (DOWN)
      [0,7],
      // Left arm bottom side (RIGHT)
      [0,8], [1,8], [2,8], [3,8], [4,8], [5,8],
      // Bottom arm left side (DOWN)
      [6,9], [6,10], [6,11], [6,12], [6,13], [6,14],
      // Bottom arm end (RIGHT)
      [7,14],
      // Bottom arm right side (UP) - just the first cell to close the loop
      [8,14]
    ];
    
    pathCoords.forEach(c => cells.push(getPos(c[0], c[1])));
    
    // Home paths (6 cells each)
    // 0: Bottom player home path (going UP)
    homePaths.push([ [7,13], [7,12], [7,11], [7,10], [7,9], [7,8] ].map(c => getPos(c[0], c[1])));
    // 1: Left player home path (going RIGHT)
    homePaths.push([ [1,7], [2,7], [3,7], [4,7], [5,7], [6,7] ].map(c => getPos(c[0], c[1])));
    // 2: Top player home path (going DOWN)
    homePaths.push([ [7,1], [7,2], [7,3], [7,4], [7,5], [7,6] ].map(c => getPos(c[0], c[1])));
    // 3: Right player home path (going LEFT)
    homePaths.push([ [13,7], [12,7], [11,7], [10,7], [9,7], [8,7] ].map(c => getPos(c[0], c[1])));
    
    return {
      cx, cy, R,
      cages,
      cells,
      homePaths,
      pieces: [],
      totalCells,
      cellsPerSegment,
      isClassic4: true,
      cellSize
    };
  }
  
  // Polygon logic for n !== 4
  let cellsPerSegment = 13;
  if (n === 2) {
    cellsPerSegment = 18;
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
    
    for (let j = 0; j < cellsPerSegment; j++) {
      const t = j / cellsPerSegment;
      const cellX = x + t * (nx - x);
      const cellY = y + t * (ny - y);
      cells.push({ x: cellX, y: cellY });
    }
  }
  
  for (let i = 0; i < n; i++) {
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
    const hPath = [];
    // 6 home cells for consistency
    for (let k = 1; k <= 6; k++) {
      const h_x = cx + (R - k * 30) * Math.cos(angle);
      const h_y = cy + (R - k * 30) * Math.sin(angle);
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
    cellsPerSegment,
    isClassic4: false
  };
}

function getMovable(board, playerIndex, diceValue) {
  const movable = [];
  const startIndex = playerIndex * board.cellsPerSegment;
  
  const playerPieces = board.pieces.filter(p => p.playerIndex === playerIndex);
  
  playerPieces.forEach(piece => {
    if (piece.isFinished) return;
    
    if (piece.position === -1) {
      if (diceValue === 6) {
        const pieceAtStart = board.pieces.find(p => p.position === startIndex && p.playerIndex === playerIndex);
        if (!pieceAtStart) {
          movable.push(piece.id);
        }
      }
    } else if (piece.homePathIndex !== -1) {
      // Home path has 6 cells (0 to 5)
      if (piece.homePathIndex + diceValue <= 6) { 
        let blocked = false;
        for (let i = 1; i <= diceValue; i++) {
          const targetPathIndex = piece.homePathIndex + i;
          if (targetPathIndex < 6 && board.pieces.find(p => p.playerIndex === playerIndex && p.homePathIndex === targetPathIndex)) {
            blocked = true;
          }
        }
        if (!blocked) movable.push(piece.id);
      }
    } else {
      let finishCell = startIndex - 1;
      if (finishCell < 0) finishCell += board.totalCells;
      
      let distanceToFinish = finishCell - piece.position;
      if (distanceToFinish < 0) distanceToFinish += board.totalCells;
      
      if (distanceToFinish === 0) {
        if (diceValue <= 6) movable.push(piece.id);
      } else if (diceValue > distanceToFinish) {
        const remaining = diceValue - distanceToFinish;
        if (remaining <= 6) {
          movable.push(piece.id);
        }
      } else {
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
    if (piece.homePathIndex === 6) {
      piece.isFinished = true;
    }
  } else {
    let finishCell = startIndex - 1;
    if (finishCell < 0) finishCell += board.totalCells;
    
    let distanceToFinish = finishCell - piece.position;
    if (distanceToFinish < 0) distanceToFinish += board.totalCells;
    
    if (diceValue > distanceToFinish) {
      piece.position = -2;
      piece.homePathIndex = diceValue - distanceToFinish - 1;
      if (piece.homePathIndex === 6) { 
        piece.isFinished = true;
      }
    } else {
      piece.position = (piece.position + diceValue) % board.totalCells;
      
      const targetPiece = board.pieces.find(p => p.position === piece.position && p.id !== piece.id);
      if (targetPiece && targetPiece.playerIndex !== playerIndex) {
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
