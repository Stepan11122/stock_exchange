import { renderGame } from './ui.js';
import { initCards } from './canvas.js';
console.log("main.js loaded");
export function initGame(player) {
    const socket = io();
    socket.emit('join', { player });
    socket.on('update_state', data => {
        initCards(['5+', 'Q-', 'J+', '10-']);
        renderGame(data, player, socket);
    });
}
