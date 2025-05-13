const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let cards = []; // Cards with positions and labels
let draggingCard = null;
let offsetX, offsetY;

export function initCards(cardLabels) {
    cards = cardLabels.map((label, i) => ({
        x: 50 + i * 110,
        y: 100,
        width: 100,
        height: 150,
        label,
    }));
    drawCards();
}

function drawCards() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let card of cards) {
        drawCard(card);
    }
}

function drawCard(card) {
    ctx.fillStyle = '#333';
    ctx.fillRect(card.x, card.y, card.width, card.height);
    ctx.fillStyle = 'white';
    ctx.font = '20px sans-serif';
    ctx.fillText(card.label, card.x + 10, card.y + 80);
}

canvas.addEventListener('mousedown', (e) => {
    const { offsetX: mx, offsetY: my } = e;
    for (let card of cards) {
        if (
            mx >= card.x &&
            mx <= card.x + card.width &&
            my >= card.y &&
            my <= card.y + card.height
        ) {
            draggingCard = card;
            offsetX = mx - card.x;
            offsetY = my - card.y;
            break;
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (draggingCard) {
        const { offsetX: mx, offsetY: my } = e;
        draggingCard.x = mx - offsetX;
        draggingCard.y = my - offsetY;
        drawCards();
    }
});

canvas.addEventListener('mouseup', () => {
    draggingCard = null;
});

canvas.addEventListener('mouseleave', () => {
    draggingCard = null;
});
