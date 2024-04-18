const gridSize = 250;
let cellSize = 50;
const minCellSize = 5;
const maxCellSize = 500;
const gridColor = '#dddddd';

const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');

const canvasSize = { width: window.innerWidth, height: window.innerHeight };
canvas.width = canvasSize.width;
canvas.height = canvasSize.height;

let offsetX = 0;
let offsetY = 0;

let grid = [];

for (let i = 0; i < gridSize; i++) {
    grid[i] = [];
    for (let j = 0; j < gridSize; j++) {
        grid[i][j] = false;
    }
}

function drawGrid() {
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    ctx.beginPath();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    for (let i = -cellSize; i < canvasSize.width + cellSize; i += cellSize) {
        for (let j = -cellSize; j < canvasSize.height + cellSize; j += cellSize) {

            const x = (Math.floor((i + offsetX) / cellSize) % gridSize + gridSize) % gridSize;
            const y = (Math.floor((j + offsetY) / cellSize) % gridSize + gridSize) % gridSize;

            ctx.fillStyle = grid[x][y] === true ? "black" : "white";
            const rectX = i - (offsetX % cellSize + cellSize) % cellSize;
            const rectY = j - (offsetY % cellSize + cellSize) % cellSize;
            ctx.fillRect(rectX, rectY, cellSize, cellSize);
            ctx.rect(rectX, rectY, cellSize, cellSize);
        }
    }

    ctx.stroke();
    genCount.innerText = generations;
}

let isDragging = false;
let lastX, lastY;
let downX, downY;

canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    downX = lastX;
    downY = lastY;
});

canvas.addEventListener('mouseup', (e) => {
    isDragging = false;
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (downX === clientX && downY === clientY && !running && e.button === 0) {
        const x = (Math.floor((clientX + offsetX) / cellSize) % gridSize + gridSize) % gridSize;
        const y = (Math.floor((clientY + offsetY) / cellSize) % gridSize + gridSize) % gridSize;
        grid[x][y] = !grid[x][y];
        generations = 0;
        drawGrid();
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;
        offsetX -= deltaX;
        offsetY -= deltaY;
        drawGrid();
        lastX = e.clientX;
        lastY = e.clientY;
    }
});

canvas.addEventListener('wheel', (e) => {
    const scaleFactor = e.deltaY > 0 ? 1.1 : 0.9;

    const newGridSize = cellSize * scaleFactor;

    if (newGridSize > maxCellSize || newGridSize < minCellSize) {
        return;
    }

    cellSize = newGridSize;

    const mouseX = e.clientX - canvas.getBoundingClientRect().left;
    const mouseY = e.clientY - canvas.getBoundingClientRect().top;

    offsetX = (offsetX - mouseX) * scaleFactor + mouseX;
    offsetY = (offsetY - mouseY) * scaleFactor + mouseY;

    drawGrid();
    e.preventDefault();
});

const startStopButton = document.getElementById('startStopButton');
const clearButton = document.getElementById('clearButton');
const speedSlider = document.getElementById('speedSlider');
const genCount = document.getElementById("gens");
let running = false;
let intervalId;
let generations = 0;

function countNeighbours(x, y) {
    let count = 0;

    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) {
                continue;
            }

            const neighbourX = ((x + i) % gridSize + gridSize) % gridSize;
            const neighbourY = ((y + j) % gridSize + gridSize) % gridSize;
            if (grid[neighbourX][neighbourY]) {
                count++;
            }
        }
    }
    return count;
}

function computeNextGeneration() {
    if (!running) {
        return;
    }

    let changes = false;
    let newGrid = grid.map(inner => inner.slice());

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const neighbours = countNeighbours(i, j);
            const state = grid[i][j];
            if ((state && (neighbours < 2 || neighbours > 3)) || (!state && neighbours === 3)) {
                newGrid[i][j] = !state;
                changes = true;
            }
        }
    }

    if (!changes) {
        stopSimulation();
    }

    grid = newGrid;
    generations++;
    drawGrid();

    if (sprinting) {
        requestAnimationFrame(computeNextGeneration);
    } else {
        setTimeout(computeNextGeneration, speedSlider.value);
    }
}

function startSimulation() {
    startStopButton.textContent = 'Stop';
    running = true;
    if (sprinting) {
        requestAnimationFrame(computeNextGeneration);
    } else {
        setTimeout(computeNextGeneration, speedSlider.value);
    }
}

function stopSimulation() {
    startStopButton.textContent = 'Start';
    running = false;
}

startStopButton.addEventListener('click', () => {
    if (startStopButton.textContent === 'Start') {
        startSimulation();
    } else {
        stopSimulation();
    }
});

clearButton.addEventListener("click", () => {
    stopSimulation();

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            grid[i][j] = false;
        }
    }
    generations = 0;
    drawGrid();
});

document.body.onkeydown = function(e) {
    if (e.key === " ") {
        if (running) {
            stopSimulation();
        } else {
            startSimulation();
        }
    }
}

const sprintButton = document.getElementById("sprint");
let sprinting = false;

sprintButton.addEventListener("click", () => {
    sprinting = sprintButton.checked;
    speedSlider.disabled = sprinting;
});

const patternSelect = document.getElementById('patternSelect');
const pastePatternButton = document.getElementById('pastePatternButton');

let patterns = [];

fetch("./patterns.json").then(response => response.json()).then(json => {
    patterns = json.patterns;

    for (const pattern of patterns) {
        const option = document.createElement("option");
        option.value = pattern.id;
        option.innerText = pattern.name;
        patternSelect.appendChild(option);
    }
});

function pastePattern(pattern) {
    for (const coordinate of pattern.coordinates) {
        grid[coordinate.x][coordinate.y] = true;
    }
}

pastePatternButton.addEventListener('click', () => {
    const selectedPattern = patternSelect.value;

    const foundPattern = patterns.find(pattern => pattern.id === selectedPattern);

    if (foundPattern) {
        pastePattern(foundPattern);
    }

    generations = 0;
    drawGrid();
});

drawGrid();