const title = document.getElementById("title");
const menu = document.getElementById("menu");
const canvas = document.getElementById("canvas");
const options = document.getElementById("options");
const sizeSlider = document.getElementById("sizeSlider");
const ruleInput = document.getElementById("ruleInput");
const gensInput = document.getElementById("gensInput");
let generations;
let cellSize;
let cellCount;

function generate() {
    title.style.transform = "translate(-50%, -13vh)";
    menu.style.transform = "translateX(-50%)";
    options.style.display = "none";
    cellSize = sizeSlider.value;
    cellCount = Math.floor(window.innerWidth / cellSize);
    const genCount = gensInput.value;
    const rule = ("00000000" + (ruleInput.value >>> 0).toString(2)).slice(-8);
    canvas.style.height = cellSize * genCount + "px";

    generations = new Array(genCount);

    for (let i = 0; i < genCount; i++) {
        generations[i] = new Array(cellCount).fill(false);
        const genContainer = document.createElement("div");
        genContainer.classList.add("gen-container");

        if (i === 0) {
            generations[i][Math.floor(cellCount / 2)] = true;
        }

        for (let j = 0; j < cellCount; j++) {
            let pattern = findPattern(i, j);
            pattern = pattern !== undefined ? pattern : 8;
            generations[i][j] = generations[i][j] ? true : rule.charAt(pattern) === "1";
            console.log("gen=" + i + ", cell=" + j + ", alive=" + generations[i][j] + ", pattern=" + pattern);
            genContainer.appendChild(createCell(generations[i][j]));
        }

        canvas.appendChild(genContainer);
    }
}

function findPattern(gen, cell) {
    try {
        let parentOne = generations[gen - 1][cell - 1];
        if (parentOne === undefined) {
            parentOne = generations[gen - 1][cellCount - 1];
        }
        let parentTwo = generations[gen - 1][cell];
        let parentThree = generations[gen -1][cell + 1];
        if (parentThree === undefined) {
            parentThree = generations[gen -1][0];
        }

        if (!parentOne && !parentTwo && !parentThree) {
            return 7;
        } else if (!parentOne && !parentTwo && parentThree) {
            return 6;
        } else if (!parentOne && parentTwo && !parentThree) {
            return 5;
        } else if (!parentOne && parentTwo && parentThree) {
            return 4;
        } else if (parentOne && !parentTwo && !parentThree) {
            return 3;
        } else if (parentOne && !parentTwo && parentThree) {
            return 2;
        } else if (parentOne && parentTwo && !parentThree) {
            return 1;
        } else if (parentOne && parentTwo && parentThree) {
            return 0;
        }
    } catch {
        return undefined;
    }
}

function createCell(alive) {
    const cellElement = document.createElement("div");
    cellElement.style.backgroundColor = alive ? "black" : "white";
    cellElement.style.height = cellSize + "px";
    cellElement.style.width = cellSize + "px";
    return cellElement;
}

function restart() {
    title.style.transform = null;
    menu.style.transform = null;
    options.style.display = null;

    canvas.textContent = "";
    canvas.style.height = "100%";
}