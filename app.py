from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import random
from models import player

app = Flask(__name__)
app.secret_key = 'supersecretkey'
socketio = SocketIO(app)

# Game setup
deck = [r + s for r in ('2','3','4','5','6','7','8','9','10','J','Q','K','A') for s in '♠♣♦♥']
random.shuffle(deck)
sid_to_player={}
trend = {'player1': '', 'player2': '', 'player3': '', 'player4': ''}
value = {'player1': '', 'player2': '', 'player3': '', 'player4': ''}
phase = "t1"

game_state = {
    'player1': player([deck.pop() for _ in range(10)],True),
    'player2': player([deck.pop() for _ in range(10)],True),
    'player3': player([deck.pop() for _ in range(10)],True),
    'player4': player([deck.pop() for _ in range(10)],True)
}

@app.route('/')
def index():
    return render_template('game.html')

@socketio.on('join')
def handle_join(data):
    player_id=data.get('player')
    sid_to_player[request.sid] = player_id
    emit('update_state', get_public_game_state(), broadcast=True)

@socketio.on('play_card')
def handle_play_card(data):
    global phase
    card = data['card']
    player_obj = game_state[sid_to_player[request.sid]]
    if phase == "t1":
        print(card)
        if card in player_obj.Hand:
            player_obj.Hand.remove(card)
            trend[sid_to_player[request.sid]] = card
            print(player_obj.Hand)
            player_obj.Turn = False
            """
            # Advance phase if all submitted
            if all(p.Turn for p in game_state.values()):
                phase = "t2"
                for p in game_state.values():
                    p.Turn = False
            """
        emit('update_state', get_public_game_state(), broadcast=True)
@socketio.on('change_card')
def handle_change_card(data):
    global phase
    player_id=sid_to_player[request.sid]
    card = data['card']
    player_obj = game_state[player_id]
    if phase=="t1":
        print(card)
        if card in player_obj.Hand:
            print("BYBYBY")
            player_obj.Hand.append(trend[player_id])
            player_obj.Hand.remove(card)
            trend[player_id] = card
    emit('update_state', get_public_game_state(), broadcast=True)
def get_public_game_state():
    return {
        'players':list(game_state.keys()),
        'trend': trend,
        'value': value,
        'phase': phase,
        'game_state': {
            pid: {
                'Hand': game_state[pid].Hand,
                'Turn': game_state[pid].Turn
            } for pid in game_state
        }
    }

if __name__ == '__main__':
    socketio.run(app, debug=True)
