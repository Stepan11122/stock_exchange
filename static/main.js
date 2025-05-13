import { renderGame } from './ui.js';

console.log("main.js loaded");

export function initGame(player) {
    const socket = io();
    socket.emit('join', { player });

    socket.on('update_state', data => {
        renderGame(data, player, socket);
    });
}