from flask import Flask, render_template, request, redirect, url_for
from models import player
import random

app = Flask(__name__)
app.secret_key = 'supersecretkey'

deck = [('2','3','4','5','6','7','8','9','10','J','Q','K','A')[i]+('♠','♣','♦','♥')[j] for i in range(0,12) for j in range(0,4)]
random.shuffle(deck)
trend={
    'player1': '',
    'player2': '',
    'player3': '',
    'player4': '',
    'Turn':False
}
value = {
    'player1': '',
    'player2': '',
    'player3': '',
    'player4': '',
    'Turn':False
}
# t1. t2, v1, v2
phase="t1"
game_state = {
    'player1': player([deck.pop() for _ in range(10)],True),
    'player2': player([deck.pop() for _ in range(10)],True),
    'player3': player([deck.pop() for _ in range(10)],True),
    'player4': player([deck.pop() for _ in range(10)],True)
}

@app.route('/')
def index():
    return redirect(url_for('player_view', CurrentPlayer='player1'))

@app.route('/<CurrentPlayer>', methods=['GET', 'POST'])
def player_view(CurrentPlayer):
    if CurrentPlayer not in game_state:
        return "Unknown player", 404
    if request.method == 'POST':
        played_card = request.form.get('card')
        print(played_card)
        if  played_card in game_state[CurrentPlayer].Hand and phase=="t1":
            if game_state[CurrentPlayer].Turn:
                print("BUBUBU")
                game_state[CurrentPlayer].Hand.remove(played_card)
                game_state[CurrentPlayer].Turn=False
                trend[CurrentPlayer]=played_card
            else:
                print("BYBYBY")
                game_state[CurrentPlayer].Hand.remove(played_card)
                game_state[CurrentPlayer].Hand.append(trend[CurrentPlayer])
                trend[CurrentPlayer]=played_card

        if  played_card in game_state[CurrentPlayer].Hand  and phase=="v1" and game_state[CurrentPlayer].Turn:
            if game_state[CurrentPlayer].Turn:
                print("BUBUBU")
                game_state[CurrentPlayer].Hand.remove(played_card)
                game_state[CurrentPlayer].Turn = False
                value.append(played_card)
            else:
                print("BYBYBY")
                game_state[CurrentPlayer].Hand.remove(played_card)
                game_state[CurrentPlayer].Hand.append(trend[CurrentPlayer])
                value[CurrentPlayer] = played_card
    #HARDCODE
    return render_template('game.html',
                           player=CurrentPlayer, players=4, hand=game_state[CurrentPlayer].Hand, trend=trend, value=value,game_state=game_state)

if __name__ == '__main__':
    app.run(debug=True)
