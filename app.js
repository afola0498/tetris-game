const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const restartBtn = document.getElementById('restartBtn');

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;
const EMPTY = 0;

const colors = {
  I: '#2dd4bf',
  J: '#60a5fa',
  L: '#f59e0b',
  O: '#facc15',
  S: '#34d399',
  T: '#a78bfa',
  Z: '#fb7185'
};

const shapes = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
  O: [[1, 1], [1, 1]],
  S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]]
};

let board = createBoard();
let currentPiece = null;
let score = 0;
let lines = 0;
let level = 1;
let dropCounter = 0;
let lastTime = 0;
let gameOver = false;

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

function randomPiece() {
  const types = Object.keys(shapes);
  const type = types[Math.floor(Math.random() * types.length)];
  const matrix = shapes[type];
  return {
    type,
    matrix,
    x: Math.floor(COLS / 2) - Math.ceil(matrix[0].length / 2),
    y: 0
  };
}

function collide(board, piece) {
  for (let y = 0; y < piece.matrix.length; y += 1) {
    for (let x = 0; x < piece.matrix[y].length; x += 1) {
      if (piece.matrix[y][x] !== 0) {
        const newX = piece.x + x;
        const newY = piece.y + y;

        if (newX < 0 || newX >= COLS || newY >= ROWS) {
          return true;
        }

        if (newY >= 0 && board[newY][newX] !== EMPTY) {
          return true;
        }
      }
    }
  }
  return false;
}

function rotateMatrix(matrix) {
  return matrix[0].map((_, index) => matrix.map(row => row[index]).reverse());
}

function rotatePiece() {
  if (!currentPiece) return;
  const rotated = rotateMatrix(currentPiece.matrix);
  const backup = currentPiece.matrix;
  currentPiece.matrix = rotated;
  if (collide(board, currentPiece)) {
    currentPiece.matrix = backup;
  }
}

function mergePiece() {
  currentPiece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        board[currentPiece.y + y][currentPiece.x + x] = currentPiece.type;
      }
    });
  });
}

function clearLines() {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y -= 1) {
    if (board[y].every(cell => cell !== EMPTY)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(EMPTY));
      cleared += 1;
      y += 1;
    }
  }
  if (cleared > 0) {
    lines += cleared;
    score += [0, 100, 300, 500, 800][cleared] * level;
    level = Math.floor(lines / 10) + 1;
    updateHud();
  }
}

function dropPiece() {
  if (!currentPiece) return;
  currentPiece.y += 1;
  if (collide(board, currentPiece)) {
    currentPiece.y -= 1;
    mergePiece();
    clearLines();
    currentPiece = null;
    spawnPiece();
    if (collide(board, currentPiece)) {
      gameOver = true;
    }
  }
}

function hardDrop() {
  if (!currentPiece) return;
  while (!collide(board, currentPiece)) {
    currentPiece.y += 1;
  }
  currentPiece.y -= 1;
  mergePiece();
  clearLines();
  currentPiece = null;
  spawnPiece();
  if (collide(board, currentPiece)) {
    gameOver = true;
  }
}

function spawnPiece() {
  currentPiece = randomPiece();
  if (collide(board, currentPiece)) {
    gameOver = true;
  }
}

function move(direction) {
  if (!currentPiece || gameOver) return;
  currentPiece.x += direction;
  if (collide(board, currentPiece)) {
    currentPiece.x -= direction;
  }
}

function updateHud() {
  scoreEl.textContent = score;
  linesEl.textContent = lines;
  levelEl.textContent = level;
}

function drawCell(x, y, type) {
  if (type === EMPTY) return;
  ctx.fillStyle = colors[type];
  ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK - 2, BLOCK - 2);
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  board.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell !== EMPTY) {
        drawCell(x, y, cell);
      }
    });
  });

  if (currentPiece) {
    currentPiece.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          drawCell(currentPiece.x + x, currentPiece.y + y, currentPiece.type);
        }
      });
    });
  }

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('Game Over', 70, 280);
  }
}

function tick(time) {
  if (!lastTime) lastTime = time;
  const delta = time - lastTime;
  lastTime = time;
  dropCounter += delta;

  if (!gameOver && dropCounter > 700 / level) {
    dropPiece();
    dropCounter = 0;
  }

  drawBoard();
  requestAnimationFrame(tick);
}

function handleKey(event) {
  if (gameOver && event.key !== 'r' && event.key !== 'R') return;

  switch (event.key) {
    case 'ArrowLeft':
      move(-1); break;
    case 'ArrowRight':
      move(1); break;
    case 'ArrowDown':
      dropPiece(); break;
    case 'ArrowUp':
      rotatePiece(); break;
    case ' ':
      event.preventDefault();
      hardDrop(); break;
    case 'r':
    case 'R':
      restart(); break;
    default:
      break;
  }
}

function restart() {
  board = createBoard();
  score = 0;
  lines = 0;
  level = 1;
  dropCounter = 0;
  lastTime = 0;
  gameOver = false;
  updateHud();
  spawnPiece();
}

restartBtn.addEventListener('click', restart);
document.addEventListener('keydown', handleKey);

updateHud();
spawnPiece();
requestAnimationFrame(tick);
