const title = document.getElementById("title");
const canvas = document.getElementById("canvas");
const container = document.getElementById("input-container");
const input = document.getElementById("input");
const menu = document.getElementById("menu");
const count = document.getElementById("count");

function submit() {
    title.style.transform = "translate(-50%, -13vh)";
    container.style.display = "none";
    const words = input.value.toLowerCase().replace(/[^a-z ]/gi, "").split(" ");
    count.innerText = words.length;
    menu.style.transform = "translateX(-50%)";

    let wordCount = [];

    for (const word of words) {
        const found = wordCount.find(existingWord => existingWord.value === word);
        if (!found) {
            wordCount.push({ value: word, count: 1 });
            continue;
        }

        found.count++;
    }

    const minCount = Math.min(...wordCount.map(item => item.count));
    const maxCount = Math.max(...wordCount.map(item => item.count));
    const newMinCount = 5;
    const newMaxCount = 200;

    const canvasRect = canvas.getBoundingClientRect();
    const minHeight = 1;
    const minWidth = 1;
    const maxHeight = 90;
    const maxWidth = 90;

    for (const word of wordCount) {
        const wordElement = document.createElement("a");
        wordElement.className = "word";
        wordElement.innerText = word.value;
        wordElement.style.fontSize = (word.count - minCount) / (maxCount - minCount) * (newMaxCount - newMinCount) + newMinCount + "px";
        wordElement.style.top = Math.random() * (maxHeight - minHeight + 1) + minHeight + "vh";
        wordElement.style.left = Math.random() * (maxWidth - minWidth + 1) + minWidth + "vw";
        wordElement.onclick = () => {
            wordElement.innerText = word.count;
            setTimeout(() => {
                wordElement.innerText = word.value;
            }, 2000);
        };
        canvas.appendChild(wordElement);
    }
}

function restart() {
    title.style.transform = null;
    container.style.display = null;
    input.value = "";
    menu.style.transform = null;

    canvas.textContent = "";
}