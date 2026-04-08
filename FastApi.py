# FastApi.py


from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import database
import schemas

app = FastAPI()


from fastapi import FastAPI

app = FastAPI()
db = database.DatabaseManager()

@app.get("/")
def root():
    return {"message": "Hello World"}

@app.get("/users/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: int):
    user = db.select(database.User, {"userid": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(user[0])

@app.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate):
    try:
        new_user = database.User(firstname=user.firstname, lastname=user.lastname)
        result = db.insert(new_user)
        return result
    except Exception as e:
        print(f"Error occurred: {e}")
        raise HTTPException(status_code=500, detail="Error occurred while creating user")
    
@app.delete("/users/{user_id}")
def delete_user(user_id: int):
    user = db.select(database.User, {"userid": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(database.User, {"userid": user_id})
    return {"message": "User deleted successfully"}

@app.put("/users/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user: schemas.UserCreate):
    try:
        existing = db.select(database.User, {"userid": user_id})
        if not existing:
            raise HTTPException(status_code=404, detail="User not found")
        
        db.update(database.User, {"userid": user_id}, user.dict(exclude_unset=True))
        updated_user = db.select(database.User, {"userid": user_id})
        print(f"Updated user: {updated_user}")
        
        # select returns a list, take the first item
        return updated_user[0]
    except HTTPException as he:
        raise  HTTPException(status_code=he.status_code, detail=he.detail)
    except Exception as e:
        print(f"Error occurred: {e}")
        raise HTTPException(status_code=500, detail="Error occurred while updating user")
    
@app.get("/matches/{match_id}", response_model=schemas.MtgMatchesResponse)
def get_match(match_id: int):
    match = db.select(database.MtgMatch, {"match_id": match_id})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return dict(match[0])

@app.put("/matches/{match_id}", response_model=schemas.MtgMatchesResponse)
def update_match(match_id: int, match: schemas.MtgMatchesResponse):
    try:
        existing = db.select(database.MtgMatch, {"match_id": match_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Match not found")
        
        db.update(database.MtgMatch, {"match_id": match_id}, match.dict(exclude_unset=True))
        updated_match = db.select(database.MtgMatch, {"match_id": match_id})
        print(f"Updated match: {updated_match}")
        
        # select returns a list, take the first item
        return updated_match[0]
    except HTTPException as he:
        raise  HTTPException(status_code=he.status_code, detail=he.detail)
    except Exception as e:
        print(f"Error occurred: {e}")
        raise HTTPException(status_code=500, detail="Error occurred while updating match")

@app.post("/matches/", response_model=schemas.MtgMatchesResponse)
def create_match(match: schemas.MtgMatchRequest):
    try:
        new_match = database.MtgMatch(
            Decklist=match.Decklist,
            match_result=match.match_result,
            date=match.date,
            group_id=match.group_id,
            comment=match.comment
        )
        result = db.insert(new_match)
        
        return result
    except Exception as e:
        print(f"Error occurred: {e}")
        raise HTTPException(status_code=500, detail="Error occurred while creating match")

@app.delete("/matches/{match_id}")
def delete_match(match_id: int):
    match = db.select(database.MtgMatch, {"match_id": match_id})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    db.delete(database.MtgMatch, {"match_id": match_id})
    return {"message": "Match deleted successfully"}

@app.get("/decks/{deck_id}", response_model=schemas.DeckResponse)
def get_deck(deck_id: int):
    deck = db.select(database.Deck, {"deckid": deck_id})
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    return dict(deck[0])

@app.post("/decks/", response_model=schemas.DeckResponse)
def create_deck(deck: schemas.DeckRequest):
    try:
        new_deck = database.Deck(
            deckname=deck.deckname,
            partnername=deck.partnername,
            color=deck.color,
            manavalue=deck.manavalue,
            deckownerid=deck.deckownerid,
            image_url=deck.image_url
        )
        result = db.insert(new_deck)
        
        return result
    except Exception as e:
        print(f"Error occurred: {e}")
        raise HTTPException(status_code=500, detail="Error occurred while creating deck")

@app.put("/decks/{deck_id}", response_model=schemas.DeckResponse)
def update_deck(deck_id: int, deck: schemas.DeckRequest):
    try:
        existing = db.select(database.Deck, {"deckid": deck_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Deck not found")
        
        db.update(database.Deck, {"deckid": deck_id}, deck.dict(exclude_unset=True))
        updated_deck = db.select(database.Deck, {"deckid": deck_id})
        print(f"Updated deck: {updated_deck}")
        
        # select returns a list, take the first item
        return updated_deck[0]
    except HTTPException as he:
        raise  HTTPException(status_code=he.status_code, detail=he.detail)
    except Exception as e:
        print(f"Error occurred: {e}")
        raise HTTPException(status_code=500, detail="Error occurred while updating deck")

@app.delete("/decks/{deck_id}")
def delete_deck(deck_id: int):
    deck = db.select(database.Deck, {"deckid": deck_id})
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    db.delete(database.Deck, {"deckid": deck_id})
    return {"message": "Deck deleted successfully"}

@app.get("/decks_by_player/{ownerid}", response_model=List[schemas.DeckResponse])
def get_decks_by_player(ownerid: int):
    decks = db.select(database.Deck, {"ownerid": ownerid})
    return decks

@app.get("/matches_by_deck/{deck_id}", response_model=List[schemas.MatchPlayersResponse])
def get_match_player(deck_id: int):
    ''' Return a list of macthes for a given deck id.'''
    mp = db.select(database.MatchPlayer, {"deck_id": deck_id})
    if not mp:
        raise HTTPException(status_code=404, detail="Match player not found")
    return mp

@app.get("/matchplayers/{mp_id}", response_model=schemas.MatchPlayersResponse)
def get_match_player(mp_id: int):
    mp = db.select(database.MatchPlayer, {"id": mp_id})
    if not mp:
        raise HTTPException(status_code=404, detail="Match player not found")
    return dict(mp[0])

@app.post("/matchplayers/", response_model=schemas.MatchPlayersResponse)
def create_match_player(mp: schemas.MatchPlayerRequest):
    try:
        new_mp = database.MatchPlayer(
            match_id=mp.match_id,
            deck_id=mp.deck_id,
            placement=mp.placement
        )
        result = db.insert(new_mp)
        
        return result
    except Exception as e:
        print(f"Error occurred: {e}")
        raise HTTPException(status_code=500, detail="Error occurred while creating match player")
    
@app.delete("/matchplayers/{mp_id}")
def delete_match_player(mp_id: int):
    mp = db.select(database.MatchPlayer, {"id": mp_id})
    if not mp:
        raise HTTPException(status_code=404, detail="Match player not found")
    db.delete(database.MatchPlayer, {"id": mp_id})
    return {"message": "Match player deleted successfully"} 

@app.put("/matchplayers/{mp_id}", response_model=schemas.MatchPlayersResponse)
def update_match_player(mp_id: int, mp: schemas.MatchPlayerRequest):
    try:
        existing = db.select(database.MatchPlayer, {"id": mp_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Match player not found")
        
        db.update(database.MatchPlayer, {"id": mp_id}, mp.dict(exclude_unset=True))
        updated_mp = db.select(database.MatchPlayer, {"id": mp_id})
        print(f"Updated match player: {updated_mp}")
        
        # select returns a list, take the first item
        return updated_mp[0]
    except HTTPException as he:
        raise  HTTPException(status_code=he.status_code, detail=he.detail)
    except Exception as e:
        print(f"Error occurred: {e}")
        raise HTTPException(status_code=500, detail="Error occurred while updating match player")
