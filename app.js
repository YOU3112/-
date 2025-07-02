const canvas = document.getElementById('tetrisCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const startButton = document.getElementById('startButton');

const COLS = 10; // ゲームボードの列数
const ROWS = 20; // ゲームボードの行数
const BLOCK_SIZE = 20; // 各ブロックのサイズ（ピクセル）

// キャンバスのサイズをブロックサイズに合わせて設定
canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

// ゲームボードの状態を表す2次元配列 (0は空、それ以外はブロックの色)
let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

// ブロックの形状と色
const TETROMINOS = [
    // I
    { shape: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], color: 'cyan' },
    // J
    { shape: [[1,0,0], [1,1,1], [0,0,0]], color: 'blue' },
    // L
    { shape: [[0,0,1], [1,1,1], [0,0,0]], color: 'orange' },
    // O
    { shape: [[1,1], [1,1]], color: 'yellow' },
    // S
    { shape: [[0,1,1], [1,1,0], [0,0,0]], color: 'green' },
    // T
    { shape: [[0,1,0], [1,1,1], [0,0,0]], color: 'purple' },
    // Z
    { shape: [[1,1,0], [0,1,1], [0,0,0]], color: 'red' }
];

let currentTetromino; // 現在落下中のテトリミノ
let currentX, currentY; // 現在落下中のテトリミノの位置

let score = 0;
let level = 1;
let gameOver = false;
let gameInterval; // ゲームループのID

// ゲームボードを描画する関数
function drawBoard() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            drawBlock(c, r, board[r][c]);
        }
    }
}

// 単一のブロックを描画する関数
function drawBlock(x, y, colorCode) {
    if (colorCode) { // 0以外の値（色を表す）の場合のみ描画
        ctx.fillStyle = colorCode; // 実際のテトリミノの色を設定する
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = '#333'; // ブロックの境界線
        ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    } else {
        // 空のマスは黒で塗りつぶす（背景をクリアする役割）
        ctx.fillStyle = '#000';
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    }
}

// 現在のテトリミノを描画する関数
function drawCurrentTetromino() {
    if (!currentTetromino) return;

    currentTetromino.shape.forEach((row, r) => {
        row.forEach((value, c) => {
            if (value === 1) {
                drawBlock(currentX + c, currentY + r, currentTetromino.color);
            }
        });
    });
}

// ゲームの描画を更新するメイン関数
function draw() {
    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 固定されたボードのブロックを描画
    drawBoard();

    // 落下中のテトリミノを描画
    drawCurrentTetromino();
}

// 新しいテトリミノを生成する関数
function generateNewTetromino() {
    const randomIndex = Math.floor(Math.random() * TETROMINOS.length);
    currentTetromino = JSON.parse(JSON.stringify(TETROMINOS[randomIndex])); // ディープコピー
    currentX = Math.floor(COLS / 2) - Math.floor(currentTetromino.shape[0].length / 2);
    currentY = 0; // 上から出現
    
    // ゲームオーバー判定
    if (!isValidMove(currentTetromino.shape, currentX, currentY)) {
        gameOver = true;
        clearInterval(gameInterval);
        alert('ゲームオーバー！ スコア: ' + score);
        startButton.textContent = 'Retry?';
        startButton.disabled = false;
    }
}

// ゲームを開始/リスタートする関数
function startGame() {
    score = 0;
    level = 1;
    gameOver = false;
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0)); // ボードをリセット
    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;
    startButton.disabled = true;
    
    generateNewTetromino();
    
    if (gameInterval) clearInterval(gameInterval); // 既存のインターバルがあればクリア
    gameInterval = setInterval(gameLoop, 1000 / level); // レベルに応じて落下速度を変更
}

// テトリミノの衝突判定（重要！）
function isValidMove(shape, x, y) {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] === 1) {
                const newX = x + c;
                const newY = y + r;

                // 範囲外チェック
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return false;
                }
                // 既にブロックがある場所との衝突チェック
                if (newY < 0) continue; // ボードの上に出現する場合はチェックしない
                if (board[newY][newX] !== 0) {
                    return false;
                }
            }
        }
    }
    return true;
}


// テトリミノをボードに固定する関数
function mergeTetromino() {
    currentTetromino.shape.forEach((row, r) => {
        row.forEach((value, c) => {
            if (value === 1) {
                board[currentY + r][currentX + c] = currentTetromino.color;
            }
        });
    });
}

// テトリミノを下に移動させる関数
function moveDown() {
    if (isValidMove(currentTetromino.shape, currentX, currentY + 1)) {
        currentY++;
    } else {
        mergeTetromino(); // 地面や他のブロックに衝突したら固定
        clearLines(); // 行が揃っているかチェックし、消去
        generateNewTetromino(); // 新しいテトリミノを生成
    }
    draw();
}

// 行が揃っているかをチェックし、消去する関数
function clearLines() {
    let linesCleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r].every(cell => cell !== 0)) { // その行が全て埋まっている場合
            board.splice(r, 1); // その行を削除
            board.unshift(Array(COLS).fill(0)); // 一番上に新しい空の行を追加
            linesCleared++;
            r++; // 行が削除されたので、同じ行をもう一度チェック
        }
    }
    if (linesCleared > 0) {
        score += linesCleared * 100 * level; // スコアを加算
        scoreDisplay.textContent = score;
        if (score >= level * 500) { // 仮のレベルアップ条件
            level++;
            levelDisplay.textContent = level;
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, 1000 / level); // 速度アップ
        }
    }
}

// キーボード入力によるテトリミノ操作
document.addEventListener('keydown', e => {
    if (gameOver) return;

    let newX = currentX;
    let newY = currentY;
    let newShape = currentTetromino.shape;

    switch (e.key) {
        case 'ArrowLeft':
            newX--;
            break;
        case 'ArrowRight':
            newX++;
            break;
        case 'ArrowDown':
            newY++; // 1マス下に移動
            break;
        case 'ArrowUp': // 回転
            // 新しい形状を生成（回転ロジック）
            newShape = rotate(currentTetromino.shape);
            break;
        case ' ': // スペースキーでハードドロップ
            while (isValidMove(currentTetromino.shape, currentX, currentY + 1)) {
                currentY++;
            }
            moveDown(); // 固定処理
            return; // ハードドロップ後はすぐに再描画し、以下の処理はスキップ
    }

    // 移動または回転が有効な場合のみ更新
    if (isValidMove(newShape, newX, newY)) {
        currentX = newX;
        currentY = newY;
        currentTetromino.shape = newShape;
    }
    draw();
});

// テトリミノを回転させる関数 (簡易版、TETROMINOSの形状に合わせる必要あり)
// 例えば、3x3の行列の場合の回転
function rotate(shape) {
    const N = shape.length;
    const M = shape[0].length;
    let newShape = Array.from({ length: M }, () => Array(N).fill(0));

    for (let r = 0; r < N; r++) {
        for (let c = 0; c < M; c++) {
            newShape[c][N - 1 - r] = shape[r][c];
        }
    }
    return newShape;
}


// ゲームループ
function gameLoop() {
    moveDown();
}

// スタートボタンのイベントリスナー
startButton.addEventListener('click', startGame);

// 初期描画
draw();
