export function renderGame(data, player, socket) {
    const container = document.getElementById('game');
    container.innerHTML = '';
    const oldTimer = document.getElementById('timer');
    if (oldTimer) oldTimer.remove();
    renderPhaseTitle(container, data.phase);
    if(data.phase!==6) {renderHand(container, data, player, socket);}
    const trendCards = createTrendPlaceholders(container, data.players);
    renderScoreBoard(container, data);

    switch (data.phase) {
        case 0:
            renderTrends(trendCards, data, player, data.players);
            break;
        case 1:
            renderTrends(trendCards, data, player);
            renderProceedSection(container, socket, player, data);
            break;
        case 2:
            renderTrends(trendCards, data, player);
            renderValues(container, data, player);
            break;
        case 3:
            renderTrends(trendCards, data, player, data.players,true);
            renderProceedSection(container, socket, player, data);
            renderValues(container, data, player);
            renderHighLowButtons(container, socket, player, data.phase, data.game_state[player].Turn);
            break;
        case 4:
            renderTrends(trendCards, data, player, data.players);
            renderProceedSection(container, socket, player, data);
            renderValues(container, data, player,true, true);
            renderHighLowButtons(container, socket, player, data.phase, data.game_state[player].Turn);
            break;
        case 5:
            renderTrends(trendCards, data, player, data.players, true);
            renderValues(container, data, player,false,true);
            renderTimer(container,data);
            break;
        case 6:
            renderFinalScores(container, data);
            break;
        default:
            container.appendChild(createText('p', 'Not known phase'));
    }
}

function renderPhaseTitle(container, phase) {
    const title = createText('h3', `Phase: ${phase}`);
    container.appendChild(title);
}

function renderHand(container, data, player, socket) {
    const hand = data.game_state[player].Hand;
    const turn = data.game_state[player].Turn;
    const phase = data.phase;

    container.appendChild(createText('p', 'Your Hand:'));
    hand.forEach(card => {
        const btn = document.createElement('button');
        btn.textContent = card;
        btn.onclick = () => {
            console.log("Button clicked in phase:", phase);
            if (phase === 0 || phase === 2) {
                if (turn) {
                    socket.emit('play_card', { player, card });
                } else {
                    socket.emit('change_card', { player, card });
                }
            }
        };
        container.appendChild(btn);
    });
}

function createTrendPlaceholders(container, players) {
    return players.map(() => {
        const p = document.createElement('p');
        container.appendChild(p);
        return p;
    });
}

function renderScoreBoard(container, data) {
    const players = data.players;

    const scoreSection = document.createElement('div');
    scoreSection.style.display = 'grid';
    scoreSection.style.gridTemplateColumns = 'repeat(auto-fit, minmax(150px, 1fr))';
    scoreSection.style.gap = '12px';
    scoreSection.style.marginTop = '20px';

    scoreSection.appendChild(createText('h3', 'Player Scores'));

    for (let player of players) {
        const scoreBox = document.createElement('div');
        scoreBox.style.border = '1px solid #ccc';
        scoreBox.style.borderRadius = '8px';
        scoreBox.style.padding = '10px';
        scoreBox.style.backgroundColor = '#f9f9f9';

        scoreBox.appendChild(createText('strong', player));
        scoreBox.appendChild(document.createElement('br'));
        scoreBox.appendChild(createText('p', `[${data.game_state[player].score.join(', ')}]`));

        scoreSection.appendChild(scoreBox);
    }

    container.appendChild(scoreSection);
}

function renderTrends(trendCards, data, player,uppercase=false) {
    const players = data.players;
    if(data.phase===1||data.phase===2){
        players.forEach((p, i) => {
            if (p === player || players[(i + 1) % players.length] === player) {
                trendCards[i].textContent = `${p} trend ${data.trend[p]}`;
            } else {
                trendCards[i].textContent = `${p} trend ${data.game_state[p].Turn}`;
            }
        });
    }
    else {
        if(data.phase===0){
            players.forEach((p, i) => {
            if (p === player){
                trendCards[i].textContent = `${p} trend ${data.trend[p]}`;
            } else {
                trendCards[i].textContent = `${p} trend ${data.game_state[p].Turn}`;
            }
        });
        }
        else{
            players.forEach((p, i) => {
            let trend = data.trend[p];
            trend = uppercase ? String(trend).toUpperCase() : trend;
            trendCards[i].textContent = `${p} trend ${trend}`;
        });
        }
    }
}

function renderProceedSection(container, socket, player, data) {
    container.appendChild(createText('h3', 'Readiness Status'));

    const turn = data.game_state[player].Turn;
    if (data.phase===1 &&turn) {
        const btn = document.createElement('button');
        btn.textContent = 'Proceed';
        btn.onclick = () => socket.emit('t2_proceed', { player });
        container.appendChild(btn);
    }

    data.players.forEach(p => {
        const status = data.game_state[p].Turn ? '❌ Not Ready' : '✅ Ready';
        container.appendChild(createText('p', `${p}: ${status}`));
    });
}

function renderValues(container, data, player, uppercase = false, show=false) {
    container.appendChild(createText('h3', 'Submitted Values'));
    data.players.forEach(p => {
        let value
        if(show){value =  data.value[p]}
        else{value = (p === player) ? data.value[p] : data.game_state[p].Turn;}
        value = uppercase ? String(value).toUpperCase() : value;
        container.appendChild(createText('p', `${p} value ${value}`));
    });
}

function renderHighLowButtons(container, socket, player, phase, turn) {
    if (!turn || (phase !== 3 && phase !== 4)) return;

    const btnHigh = document.createElement('button');
    btnHigh.textContent = 'High';
    btnHigh.onclick = () => socket.emit('high', { player });

    const btnLow = document.createElement('button');
    btnLow.textContent = 'Low';
    btnLow.onclick = () => socket.emit('low', { player });

    container.appendChild(btnHigh);
    container.appendChild(btnLow);
}

function createText(tag, text) {
    const el = document.createElement(tag);
    el.textContent = text;
    return el;
}
function renderTimer(container, data){
    const timerDisplay = document.createElement('h3');
    timerDisplay.id = 'timer';
    timerDisplay.textContent = `⏳ Time left: ${data.timer}s`;
    container.appendChild(timerDisplay);
}
function calculateTotalScores(data) {
    const scores = {};
    data.players.forEach(player => {
        const scoreArray = data.game_state[player].score || [];
        scores[player] = scoreArray.reduce((a, b) => a + b, 0);
    });
    return scores;
}
function renderFinalScores(container, data) {
    const totalScores = calculateTotalScores(data);

    const finalSection = document.createElement('div');
    finalSection.style.marginTop = '30px';

    finalSection.appendChild(createText('h2', '🏆 Final Scores'));

    data.players
        .sort((a, b) => totalScores[b] - totalScores[a]) // Descending order
        .forEach(player => {
            const p = document.createElement('p');
            p.style.fontSize = '1.2em';
            p.textContent = `${player}: ${totalScores[player]} pts`;
            finalSection.appendChild(p);
        });

    container.appendChild(finalSection);
}
