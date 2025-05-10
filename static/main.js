console.log("main.js loaded");
function initGame(player) {
    const socket = io();
    socket.emit('join', { player });

    socket.on('update_state', data => {
        renderGame(data, player, socket);
    });
}

function renderGame(data, player, socket) {
    const container = document.getElementById('game');
    container.innerHTML = ''; // Clear previous content

    const hand = data.game_state[player].Hand;
    const turn = data.game_state[player].Turn;
    const players=data.players;
    const phase = data.phase;

    const title = document.createElement('h3');
    title.textContent = `Phase: ${phase}`;
    container.appendChild(title);

    if (phase === 't1') {
        const label = document.createElement('p');
        const played_cards=[]
        for (let i = 0; i < players.length; i++) {
            played_cards[i]=document.createElement('p')
            container.appendChild(played_cards[i]);
        }
        label.textContent = 'Your Hand:';
        container.appendChild(label);

        hand.forEach(card => {
            const btn = document.createElement('button');
            btn.textContent = card;
            btn.onclick = () => {
                if(turn){socket.emit('play_card', { player: player, card: card });}
                else{socket.emit('change_card', { player: player, card: card });}
            };
            container.appendChild(btn);
        });
        for (let i = 0; i < players.length; i++) {
            console.log('QQQQQQQ');
            if(players[i]==player){played_cards[i].textContent = players[i]+data.trend[player];}
            else {played_cards[i].textContent = players[i]+data.game_state[players[i]].Turn;}
        }

    } else {
        const info = document.createElement('p');
        info.textContent = 'Not t1';
        container.appendChild(info);
    }
}
