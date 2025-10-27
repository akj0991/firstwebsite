const canvas = document.getElementById('life-canvas');
const instructions = document.querySelector('.instructions');
const INSTRUCTIONS_TEXT = 'Click anywhere to bring a cell to life.';
const ctx = canvas.getContext('2d');

const ALIVE_COLOR = '#9be7a3';
const DEAD_COLOR = '#ffffff';
const STEP_INTERVAL = 500; // milliseconds

let columns = 0;
let rows = 0;
let cellSize = 20;
let grid = [];
let buffer = [];
let lastTimestamp = 0;
let isPaused = false;

function resizeGrid() {
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
    const pixelSize = Math.min(800, size);

    canvas.width = pixelSize;
    canvas.height = pixelSize;

    cellSize = Math.max(8, Math.floor(pixelSize / 40));
    columns = Math.max(1, Math.floor(canvas.width / cellSize));
    rows = Math.max(1, Math.floor(canvas.height / cellSize));

    const createGrid = () => Array.from({ length: rows }, () => Array(columns).fill(false));

    const newGrid = createGrid();

    for (let y = 0; y < Math.min(rows, grid.length); y += 1) {
        for (let x = 0; x < Math.min(columns, grid[0]?.length || 0); x += 1) {
            newGrid[y][x] = grid[y]?.[x] ?? false;
        }
    }

    grid = newGrid;
    buffer = createGrid();
    drawGrid();
}

function drawGrid() {
    ctx.fillStyle = DEAD_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = ALIVE_COLOR;
    for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < columns; x += 1) {
            if (grid[y][x]) {
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
    }
}

function countNeighbors(x, y) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < columns && ny >= 0 && ny < rows && grid[ny][nx]) {
                count += 1;
            }
        }
    }
    return count;
}

function step() {
    for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < columns; x += 1) {
            const neighbors = countNeighbors(x, y);
            const alive = grid[y][x];
            buffer[y][x] = neighbors === 3 || (alive && neighbors === 2);
        }
    }

    const temp = grid;
    grid = buffer;
    buffer = temp;

    drawGrid();
}

function animationLoop(timestamp) {
    if (!isPaused && timestamp - lastTimestamp >= STEP_INTERVAL) {
        step();
        lastTimestamp = timestamp;
    }
    requestAnimationFrame(animationLoop);
}

function setPaused(paused) {
    isPaused = paused;
    if (!instructions) {
        return;
    }
    if (paused) {
        instructions.innerHTML = `${INSTRUCTIONS_TEXT}<br>Paused`;
    } else {
        instructions.innerHTML = INSTRUCTIONS_TEXT;
    }
}

function togglePause() {
    setPaused(!isPaused);
}

function activateCell(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width / cellSize);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height / cellSize);

    if (x >= 0 && x < columns && y >= 0 && y < rows) {
        if (isPaused) {
            grid[y][x] = !grid[y][x];
        } else {
            grid[y][x] = true;
        }
        drawGrid();
    }
}

canvas.addEventListener('click', activateCell);
canvas.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse') {
        activateCell(event);
    }
});

document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        event.preventDefault();
        togglePause();
        if (!isPaused) {
            lastTimestamp = performance.now();
        }
    }
});

window.addEventListener('resize', () => {
    resizeGrid();
});

resizeGrid();
setPaused(false);
requestAnimationFrame(animationLoop);
