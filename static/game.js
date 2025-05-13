const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Оптимизация: кэширование размеров canvas
let canvasWidth = canvas.width;
let canvasHeight = canvas.height;

// Для поддержки ресайза окна
window.addEventListener('resize', () => {
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    draw();
});

let cards = [];
let currentDragging = null;
let needsRedraw = true; // Флаг для оптимизации отрисовки

// Инициализация всех карт с обработкой ошибок
function initCards(cardData) {
    if (!Array.isArray(cardData)) {
        console.error("Invalid card data: expected array");
        return;
    }

    const loadPromises = cardData.map(data => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = data.imageSrc;
            
            const card = {
                ...data,
                image: img,
                loaded: false,
                dragging: false,
                offsetX: 0,
                offsetY: 0,
                zIndex: 0 // Для управления порядком отрисовки
            };

            img.onload = () => {
                card.loaded = true;
                resolve(card);
            };

            img.onerror = () => {
                console.error(`Failed to load image: ${data.imageSrc}`);
                resolve(null); // Продолжаем даже если одна карта не загрузилась
            };

            cards.push(card);
        });
    });

    // Когда все карты загружены
    Promise.all(loadPromises).then(() => {
        console.log("All cards loaded");
        requestAnimationFrame(drawLoop); // Запускаем игровой цикл
    });
}

// Игровой цикл с оптимизацией отрисовки
function drawLoop() {
    if (needsRedraw) {
        draw();
        needsRedraw = false;
    }
    requestAnimationFrame(drawLoop);
}

// Рисуем все карты с сортировкой по zIndex
function draw() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Сортируем карты по zIndex перед отрисовкой
    const sortedCards = [...cards].sort((a, b) => a.zIndex - b.zIndex);
    
    sortedCards.forEach(card => {
        if (card.loaded) {
            ctx.drawImage(card.image, card.x, card.y, card.width, card.height);
            
            // Отладочная рамка при перетаскивании
            if (card.dragging) {
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                ctx.lineWidth = 2;
                ctx.strokeRect(card.x, card.y, card.width, card.height);
            }
        }
    });
}

// Проверка попадания курсора в карту (с учетом возможного поворота/масштаба)
function getCardAt(x, y) {
    for (let i = cards.length - 1; i >= 0; i--) {
        const card = cards[i];
        if (card.loaded && isPointInCard(x, y, card)) {
            return card;
        }
    }
    return null;
}

function isPointInCard(x, y, card) {
    return x >= card.x && x <= card.x + card.width &&
           y >= card.y && y <= card.y + card.height;
}

// Обработчики событий
function setupEventListeners() {
    // Мышь
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);
    
    // Тач-события для мобильных устройств
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);
}

function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    startDrag(x, y);
}

function handleMouseMove(e) {
    if (!currentDragging) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    currentDragging.x = x - currentDragging.offsetX;
    currentDragging.y = y - currentDragging.offsetY;
    
    // Ограничиваем перемещение в пределах canvas
    currentDragging.x = Math.max(0, Math.min(canvasWidth - currentDragging.width, currentDragging.x));
    currentDragging.y = Math.max(0, Math.min(canvasHeight - currentDragging.height, currentDragging.y));
    
    needsRedraw = true;
}

function handleMouseUp() {
    if (currentDragging) {
        currentDragging.dragging = false;
        currentDragging = null;
        needsRedraw = true;
    }
}

// Тач-обработчики
function handleTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        startDrag(x, y);
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (currentDragging && e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        currentDragging.x = x - currentDragging.offsetX;
        currentDragging.y = y - currentDragging.offsetY;
        
        // Ограничиваем перемещение
        currentDragging.x = Math.max(0, Math.min(canvasWidth - currentDragging.width, currentDragging.x));
        currentDragging.y = Math.max(0, Math.min(canvasHeight - currentDragging.height, currentDragging.y));
        
        needsRedraw = true;
    }
}

function handleTouchEnd() {
    handleMouseUp();
}

// Общая функция начала перетаскивания
function startDrag(x, y) {
    const card = getCardAt(x, y);
    if (card) {
        card.dragging = true;
        card.offsetX = x - card.x;
        card.offsetY = y - card.y;
        currentDragging = card;
        
        // Поднимаем карту наверх
        cards.forEach(c => c.zIndex = 0);
        card.zIndex = 1;
        
        needsRedraw = true;
    }
}

// Инициализация игры
function initGame() {
    setupEventListeners();
    if (window.cardData) {
        initCards(window.cardData);
    } else {
        console.error("No card data provided");
    }
}

// Запускаем игру когда DOM готов
document.addEventListener('DOMContentLoaded', initGame);