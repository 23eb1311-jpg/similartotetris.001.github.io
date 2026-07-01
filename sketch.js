const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

let board = [];
let currentPiece;
let gameOver = false;
let score = 0;
let dropInterval = 1000; // ブロックが落ちる間隔（ミリ秒）
let lastDropTime = 0;

// テトリミノの形状定義（0: 空白, 1: ブロック）
const SHAPES = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[0, 1, 0], [1, 1, 1]], // T
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 1, 0], [0, 1, 1]], // Z
  [[1, 0, 0], [1, 1, 1]], // J
  [[0, 0, 1], [1, 1, 1]]  // L
];

const COLORS = [
  '#00f0f0', '#f0f000', '#a000f0', '#00f000', '#f00000', '#0000f0', '#f0a000'
];

function setup() {
  createCanvas(COLS * BLOCK_SIZE + 150, ROWS * BLOCK_SIZE);
  resetGame();
}

function draw() {
  background(40);
  
  // 盤面の描画
  drawBoard();
  
  if (gameOver) {
    drawGameOver();
    return;
  }
  
  // 一定時間ごとに自動落下
  if (millis() - lastDropTime > dropInterval) {
    movePiece(0, 1);
    lastDropTime = millis();
  }
  
  // 現在のブロックを描画
  currentPiece.draw();
  
  // スコアなどのUI描画
  drawUI();
}

// ゲームのリセット
function resetGame() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  score = 0;
  gameOver = false;
  spawnPiece();
}

// 新しいブロックを生成
function spawnPiece() {
  let id = floor(random(SHAPES.length));
  currentPiece = new Piece(SHAPES[id], COLORS[id]);
  
  // 生成直後に衝突している場合はゲームオーバー
  if (currentPiece.collides(0, 0, currentPiece.matrix)) {
    gameOver = true;
  }
}

// キーボード操作（移動と即時落下）
function keyPressed() {
  if (gameOver) {
    if (key === 'r' || key === 'R') resetGame();
    return;
  }
  
  if (keyCode === LEFT_ARROW) {
    movePiece(-1, 0);
  } else if (keyCode === RIGHT_ARROW) {
    movePiece(1, 0);
  } else if (keyCode === DOWN_ARROW) {
    movePiece(0, 1);
  } else if (key === ' ') { // スペースキーで一気に落とす
    while (movePiece(0, 1)) {}
  }
}

// マウスクリックでブロックを回転
function mousePressed() {
  if (gameOver) return;
  
  // 画面内がクリックされた場合のみ回転
  if (mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height) {
    currentPiece.rotate();
  }
}

// ブロックの移動処理
function movePiece(dx, dy) {
  if (!currentPiece.collides(dx, dy, currentPiece.matrix)) {
    currentPiece.x += dx;
    currentPiece.y += dy;
    return true;
  }
  
  // 下方向に動けず、衝突した場合は固定する
  if (dy > 0) {
    lockPiece();
    clearLines();
    spawnPiece();
  }
  return false;
}

// ブロックを盤面に固定
function lockPiece() {
  for (let r = 0; r < currentPiece.matrix.length; r++) {
    for (let c = 0; c < currentPiece.matrix[r].length; c++) {
      if (currentPiece.matrix[r][c]) {
        let boardX = currentPiece.x + c;
        let boardY = currentPiece.y + r;
        if (boardY >= 0) {
          board[boardY][boardX] = currentPiece.color;
        }
      }
    }
  }
}

// 揃った行を消去
function clearLines() {
  let linesCleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(cell => cell !== 0)) {
      board.splice(r, 1);
      board.unshift(Array(COLS).fill(0));
      linesCleared++;
      r++; // 行がずれるためインデックスを調整
    }
  }
  if (linesCleared > 0) {
    score += linesCleared * 100;
  }
}

// 盤面の描画
function drawBoard() {
  stroke(60);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c]) {
        fill(board[r][c]);
      } else {
        fill(20);
      }
      rect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    }
  }
}

// UIの描画
function drawUI() {
  fill(255);
  noStroke();
  textSize(20);
  textAlign(LEFT, TOP);
  text(`SCORE\n${score}`, COLS * BLOCK_SIZE + 20, 30);
  
  textSize(12);
  text("【操作方法】\n← → : 移動\n↓ : 加速\nSpace : 即時落下\n\n★クリックで回転", COLS * BLOCK_SIZE + 20, 120);
}

// ゲームオーバー画面の描画
function drawGameOver() {
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);
  
  fill(255, 50, 50);
  textSize(30);
  textAlign(CENTER, CENTER);
  text("GAME OVER", (COLS * BLOCK_SIZE) / 2, height / 2 - 30);
  
  fill(255);
  textSize(16);
  text("Press 'R' to Restart", (COLS * BLOCK_SIZE) / 2, height / 2 + 20);
}

// ブロック（テトリミノ）のクラス
class Piece {
  constructor(matrix, color) {
    this.matrix = matrix;
    this.color = color;
    this.x = floor(COLS / 2) - floor(matrix[0].length / 2);
    this.y = 0;
  }
  
  // ブロックの描画
  draw() {
    fill(this.color);
    stroke(60);
    for (let r = 0; r < this.matrix.length; r++) {
      for (let c = 0; c < this.matrix[r].length; c++) {
        if (this.matrix[r][c]) {
          let drawX = (this.x + c) * BLOCK_SIZE;
          let drawY = (this.y + r) * BLOCK_SIZE;
          if (drawY >= 0) {
            rect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
          }
        }
      }
    }
  }
  
  // 回転処理（行列の転置と反転）
  rotate() {
    let newData = [];
    for (let c = 0; c < this.matrix[0].length; c++) {
      let row = [];
      for (let r = this.matrix.length - 1; r >= 0; r--) {
        row.push(this.matrix[r][c]);
      }
      newData.push(row);
    }
    
    // 回転可能か（壁や他のブロックにめり込まないか）チェック
    if (!this.collides(0, 0, newData)) {
      this.matrix = newData;
    } else {
      // 左右に少しずらせば回転できる場合の簡易補正（壁蹴り）
      if (!this.collides(-1, 0, newData)) {
        this.x -= 1;
        this.matrix = newData;
      } else if (!this.collides(1, 0, newData)) {
        this.x += 1;
        this.matrix = newData;
      }
    }
  }
  
  // 衝突判定
  collides(dx, dy, matrix) {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          let nextX = this.x + c + dx;
          let nextY = this.y + r + dy;
          
          // 壁や底、固定済みブロックとの衝突をチェック
          if (nextX < 0 || nextX >= COLS || nextY >= ROWS) {
            return true;
          }
          if (nextY >= 0 && board[nextY][nextX]) {
            return true;
          }
        }
      }
    }
    return false;
  }
}
