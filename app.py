import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import random
from models import player
import time
import threading

PHASE_5_TIMER=1
PHASE_1_TIMER=1
app = Flask(__name__)
app.secret_key = 'supersecretkey'
socketio = SocketIO(app, cors_allowed_origins="*")

#A - 18 sf in first half of the game, 9 else.
#If played for 18, current and next 2 turns: positive and negative capped
#K +-7
#Q 1 11
#J 5 if high two next turn positive points +=const else 10
deck = [r + s for r in ('1','2','3','4','5','6','7','8','9','10') for s in '+-+-+-']+[r+s for r in ('J','Q','K','A') for s in '+-+-']
random.shuffle(deck)
sid_to_player={}
trend = {'player1': '', 'player2': '', 'player3': '', 'player4': ''}
value = {'player1': '', 'player2': '', 'player3': '', 'player4': ''}
dynamic_card_values={'q':1,'Q':11,'k':-7,'K':7,'J':5,'j':10}
#0 trend first card 1 trend reveal communication 2 value 3 trend post factum 4 value reveal, post factum 5 count and reset
phase = 0
turn = 1
timer=0

game_state = {
    'player1': player([deck.pop() for _ in range(18)],True),
    'player2': player([deck.pop() for _ in range(18)],True),
    'player3': player([deck.pop() for _ in range(18)],True),
    'player4': player([deck.pop() for _ in range(18)],True)
}
#Rules needed
def card_value(card):
    coof=1
    if card[-1]=='-1': coof=-1
    if card[0].lower() not in ('j','q','k','a'):
        return coof*int(card[:-1])
    if card[0].lower() in ('a'):
        if turn<=5:
            return coof*18
        return coof*9
    return coof*dynamic_card_values[card[0]]
def damping_coof():
    trend_score=sum([card_value(c) for c in trend.values()])
    value_score=sum([card_value(c) for c in value.values()])
    if trend_score*(0.5*trend_score+value_score)<=0:
        return -6
    return 1

@app.route('/')
def game():
    cards = [
        {"id": 1, "x": 100, "y": 100, "width": 80, "height": 120, "imageSrc": "/static/2.png"},
        {"id": 2, "x": 200, "y": 100, "width": 80, "height": 120, "imageSrc": "/static/1.png"}
    ]
    print(cards)
    return render_template("game.html", cards_json=cards)


@socketio.on('join')
def handle_join(data):
    player_id=data.get('player')
    sid_to_player[request.sid] = player_id
    emit('update_state', get_public_game_state(), broadcast=True)

@socketio.on('play_card')
def handle_play_card(data):
    global phase
    card = data['card']
    player_id=sid_to_player[request.sid]
    player_obj = game_state[player_id]
    print(card)
    if phase == 0:
        if data['player']==player_id:
            player_obj.Hand.remove(card)
            trend[player_id] = card
            player_obj.Turn = False
            if all((not p.Turn) for p in game_state.values()):
                proceed_phase()
    elif phase==2:
        if data['player']==player_id:
            print("CUCUCU")
            player_obj.Hand.remove(card)
            value[sid_to_player[request.sid]] = card
            player_obj.Turn = False
            if all((not p.Turn) for p in game_state.values()):
                proceed_phase()
    emit('update_state', get_public_game_state(), broadcast=True)
@socketio.on('change_card')
def handle_change_card(data):
    global phase
    player_id=sid_to_player[request.sid]
    card = data['card']
    player_obj = game_state[player_id]
    print(card)
    if phase==0:
        if data['player']==player_id:
            print("BYBYBY")
            player_obj.Hand.append(trend[player_id])
            player_obj.Hand.remove(card)
            trend[player_id] = card
    elif phase==2:
        if  data['player']==player_id:
            print("CYCYCY")
            player_obj.Hand.append(value[player_id])
            player_obj.Hand.remove(card)
            value[player_id] = card
    emit('update_state', get_public_game_state(), broadcast=True)
@socketio.on('t2_proceed')
def handle_t2_proceed(data):
    global phase
    player_id=sid_to_player[request.sid]
    player_obj=game_state[player_id]
    if player_obj.Turn and data['player']==player_id:
        player_obj.Turn=False
    if all((not p.Turn) for p in game_state.values()):
        proceed_phase()
    emit('update_state', get_public_game_state(), broadcast=True)
@socketio.on('high')
def handle_high(data):
    print("AAA")
    player_id=sid_to_player[request.sid]
    player_obj = game_state[player_id]
    if phase == 3:
        if  data['player']==player_id:
            player_obj.Turn = False
            if all((not p.Turn) for p in game_state.values()):
                proceed_phase()
    elif phase == 4:
        if data['player']==player_id:
            player_obj.Turn = False
            if all((not p.Turn) for p in game_state.values()):
                proceed_phase()
    socketio.emit('update_state', get_public_game_state())
@socketio.on('low')
def handle_low(data):
    player_id = sid_to_player[request.sid]
    player_obj = game_state[player_id]
    if phase == 3:
        if data['player'] == player_id:
            trend[sid_to_player[request.sid]] = trend[sid_to_player[request.sid]].lower()
            player_obj.Turn = False
            if all((not p.Turn) for p in game_state.values()):
                proceed_phase()
    elif phase == 4:
        if data['player']==player_id:
            value[sid_to_player[request.sid]] = value[sid_to_player[request.sid]].lower()
            player_obj.Turn = False
            if all((not p.Turn) for p in game_state.values()):
                proceed_phase()
    socketio.emit('update_state', get_public_game_state())
@socketio.on('proceed_phase')
def proceed_phase():
    global phase
    global timer
    global turn
    global trend
    global value
    if phase==4:update_score(5)
    if phase in(0,1,4):
        for p in game_state.values():
            p.Turn = True
        if phase == 0: start_timer(PHASE_1_TIMER, 1)
        phase += 1
        socketio.emit('update_state', get_public_game_state())
        return
    if phase==2:
        phase += 1
        any_true_1 = False
        for p in game_state.keys():
            if trend[p][0] in ('J', 'Q', 'K'):
                game_state[p].Turn = True
                any_true_1 = True
        if not any_true_1:
            phase += 1
            any_true_2 = False
            for p in game_state.keys():
                if value[p][0] in ('J', 'Q', 'K'):
                    game_state[p].Turn = True
                    any_true_2 = True
            if not any_true_2:
                phase += 1
                update_score(5)
        socketio.emit('update_state', get_public_game_state())
        return
    if phase==3:
        phase += 1
        any_true_1 = False
        for p_id in game_state.keys():
            if value[p_id][0].lower() in ('j', 'q', 'k'):
                game_state[p_id].Turn = True
                any_true_1 = True
        if not any_true_1:
            phase += 1
            update_score(5)
        socketio.emit('update_state', get_public_game_state())
        return
    if phase==5:
        if turn<9:
            for p in game_state.values():
                p.Turn=True
            turn+=1
            trend = {'player1': '', 'player2': '', 'player3': '', 'player4': ''}
            value = {'player1': '', 'player2': '', 'player3': '', 'player4': ''}
            phase=0
        else:
            phase=6
        socketio.emit('update_state', get_public_game_state())
        return
def handle_timer_finish(type,startphase):
    print(type, startphase)
    if type=='phase' and startphase==phase:
        print('phase proceeded')
        proceed_phase()
        socketio.emit('update_state', get_public_game_state())
def countdown_timer(startphase,type='phase'):
    global timer
    while timer>0:
        print(timer)
        timer-=1
        socketio.emit('update_state', get_public_game_state())
        time.sleep(1)
    else:
        print('exit cycle')
    handle_timer_finish(type,startphase)
def update_score(phase):
    global timer
    coof = damping_coof()
    for p in game_state.keys():
        player_obj = game_state[p]
        p_score = card_value(value[p]) * coof * sum([card_value(c) for c in trend.values()])
        if turn <= 4 and (trend[p][0] == 'A' or value[p][0] == 'A'):
            player_obj.Ace_Turns += [True]
        else:
            player_obj.Ace_Turns += [False]
        if trend[p][0] == 'J' or value[p][0] == 'J':
            player_obj.Jack_Turns += [True]
        else:
            player_obj.Jack_Turns += [False]
        if True in player_obj.Jack_Turns[min(0, turn - 2):]:
            if p_score >= 0: p_score += 100
        if True in player_obj.Ace_Turns[min(0, turn - 3):]:
            if p_score <= 0:
                p_score = min(p_score, -100)
            else:
                p_score = min(p_score, 250)
        game_state[p].score += [p_score]
    start_timer(PHASE_5_TIMER,phase)
def start_timer(timer_set,phase):
    global timer
    timer=timer_set
    threading.Thread(target=countdown_timer, args=(phase, 'phase')).start()
def get_public_game_state():
    print(timer)
    return {
        'players':list(game_state.keys()),
        'trend': trend,
        'value': value,
        'phase': phase,
        'timer':timer,
        'game_state': {
            pid: {
                'Hand': game_state[pid].Hand,
                'Turn': game_state[pid].Turn,
                'score': game_state[pid].score,
            } for pid in game_state
        }
    }
if __name__ == '__main__':
    socketio.run(app, debug=True)
