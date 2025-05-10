from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

"""class card:
    def __init__(self, Value, Suit):
        self.Value=Value
        self.Suit=Suit
    def __str__(self):
        return ('♠','♣','♦','♥')[self.Suit]+('2','3','4','5','6','7','8','9','10','J','Q','K','A')[self.Value]

#returns card from string of card
def createCard(ValueString):
    return card(('♠','♣','♦','♥').index(ValueString[0]), ('2','3','4','5','6','7','8','9','10','J','Q','K','A').index(ValueString[1:]))
"""
class player:
    def __init__(self, hand, turn):
        self.Hand=hand
        self.Turn=turn