# FastApi.py


import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from typing import List

import uvicorn
import database as database
import schemas as schemas

app = FastAPI(
    title="MTG Commander Tracker",
    description="API for tracking Commander match results, decks, and player stats.",
    version="1.0.0"
)  # ← only ONE of these

# Comma-separated list of allowed origins, e.g. "https://myapp.vercel.app,http://localhost:5173".
# Falls back to "*" (any origin) so existing deployments keep working unchanged,
# but you should set ALLOWED_ORIGINS in production once you know the frontend's URL.
_allowed_origins = os.getenv("ALLOWED_ORIGINS")
allow_origins = [o.strip() for o in _allowed_origins.split(",")] if _allowed_origins else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Compresses any response over 500 bytes. /matches/detail and
# /decks/with-stats are fetched on nearly every page now (tier list,
# progression charts, filters) and only grow as match history accumulates —
# this is a transparent win with no frontend changes needed.
app.add_middleware(GZipMiddleware, minimum_size=500)

db = database.DatabaseManager()

@app.get("/")
def root():
    return {"message": "Hello World"}

@app.get("/users/", response_model=List[schemas.UserResponse])
def get_all_users():
    users = db.select(database.User, {})
    return users

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

@app.get("/matches/", response_model=List[schemas.MtgMatchesResponse])
def get_all_matches():
    matches = db.select(database.MtgMatch, {})
    return matches  

# NOTE: this must be registered before /matches/{match_id}. FastAPI/Starlette
# tries routes in registration order, and since {match_id} here has no
# explicit ":int" converter in the path string, a literal "detail" segment
# would otherwise match {match_id} first (as the string "detail") and blow
# up with a 422 when FastAPI tries to coerce it to int, instead of ever
# reaching this handler.
@app.get("/matches/detail", response_model=List[schemas.MatchDetailResponse])
def get_all_matches_detail():
    """
    Return every match with its players+deck names already joined in.

    This exists so the frontend can render the Matches page with ONE request
    instead of fetching /matches/ and then /matches/{id}/detail once per
    match (an N+1 waterfall that used to make the page get slower as more
    matches were logged).
    """
    matches = db.execute_query("SELECT * FROM MTGMatches ORDER BY match_id DESC")
    if not matches:
        return []

    players_query = """
        SELECT mp.id, mp.match_id, mp.deck_id, mp.placement, mp.won, d.deckname AS deck_name, d.ownerid AS owner_id
        FROM MatchPlayers mp
        JOIN Decks d ON d.deckid = mp.deck_id
        ORDER BY mp.placement
    """
    all_players = db.execute_query(players_query)

    players_by_match = {}
    for p in all_players:
        players_by_match.setdefault(p["match_id"], []).append(p)

    return [
        {
            "match_id": m["match_id"],
            "date": m["date"],
            "group_id": m["group_id"],
            "comment": m["comment"],
            "players": players_by_match.get(m["match_id"], []),
        }
        for m in matches
    ]

@app.get("/matches/{match_id}", response_model=schemas.MtgMatchesResponse)
def get_match(match_id: int):
    match = db.select(database.MtgMatch, {"match_id": match_id})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return dict(match[0])

@app.get("/matches/{match_id}/detail")
def get_match_detail(match_id: int):
    # get the match itself
    match = db.select(database.MtgMatch, {"match_id": match_id})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # get all match players for this match, already joined with deck name
    query = """
        SELECT mp.id, mp.match_id, mp.deck_id, mp.placement, mp.won, d.deckname AS deck_name, d.ownerid AS owner_id
        FROM MatchPlayers mp
        JOIN Decks d ON d.deckid = mp.deck_id
        WHERE mp.match_id = :match_id
        ORDER BY mp.placement
    """
    players_with_decks = db.execute_query(query, {"match_id": match_id})

    return {
        "match_id": match[0]["match_id"],
        "date": match[0]["date"],
        "group_id": match[0]["group_id"],
        "comment": match[0]["comment"],
        "players": players_with_decks
    }

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

@app.get("/decks/name/{deckname}", response_model=schemas.DeckResponse)
def get_deck_by_name(deckname: str):
    deck = db.select(database.Deck, {"deckname": deckname})
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    return dict(deck[0])


@app.get("/decks/", response_model=List[schemas.DeckResponse])
def get_all_decks():
    decks = db.select(database.Deck, {})
    return decks

# NOTE: must be registered before /decks/{deck_id} — see the comment on
# /matches/detail above for why (same {param}-swallows-literal-segment
# ordering issue).
@app.get("/decks/with-stats", response_model=List[schemas.DeckWithStatsResponse])
def get_decks_with_stats(ownerid: int | None = None):
    """
    Return decks together with their match/win counts and the date they were
    last played, computed with a single SQL join+aggregate.

    Replaces the old frontend pattern of fetching /decks/ and then calling
    /matches_by_deck/{id} once per deck (N+1 requests -> now always 1).
    Pass ?ownerid=<id> to scope this to one player's decks (used by the
    player detail page).
    """
    where_clause = "WHERE d.ownerid = :ownerid" if ownerid is not None else ""
    query = f"""
        SELECT
            d.deckid, d.deckname, d.partnername, d.color, d.manavalue,
            d.ownerid, d.image_url,
            COUNT(mp.id) AS matches,
            COALESCE(SUM(mp.won), 0) AS wins,
            MAX(m.date) AS last_played
        FROM Decks d
        LEFT JOIN MatchPlayers mp ON mp.deck_id = d.deckid
        LEFT JOIN MTGMatches m ON m.match_id = mp.match_id
        {where_clause}
        GROUP BY d.deckid
        ORDER BY d.deckid
    """
    params = {"ownerid": ownerid} if ownerid is not None else {}
    return db.execute_query(query, params)

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
            image_url=deck.image_url,
            ownerid=deck.ownerid
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

@app.delete("/decks/name/{deckname}")
def delete_deck_by_name(deckname: str):
    deck = db.select(database.Deck, {"deckname": deckname})
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    db.delete(database.Deck, {"deckname": deckname})
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

@app.get("/matches_by_deck/{deck_id}/detail", response_model=List[schemas.DeckMatchHistoryEntry])
def get_match_history_for_deck(deck_id: int):
    """
    Return this deck's match-player rows already joined with each match's
    date/comment, in one query. Replaces the old pattern of fetching
    /matches_by_deck/{id} and then /matches/{match_id} once per match.
    """
    query = """
        SELECT mp.id, mp.match_id, mp.placement, mp.won, m.date, m.comment
        FROM MatchPlayers mp
        JOIN MTGMatches m ON m.match_id = mp.match_id
        WHERE mp.deck_id = :deck_id
        ORDER BY m.date DESC
    """
    return db.execute_query(query, {"deck_id": deck_id})

@app.get("/matches_by_player/{ownerid}", response_model=List[schemas.MatchPlayersResponse])
def get_matches_by_player(ownerid: int):
    '''
    Return every match-player row across all of this player's decks.

    Used by the player detail page's charts (win rate by deck, placement
    distribution), which need per-match granularity, not just aggregate
    counts. Previously this looped once per deck (N+1 queries); now it's a
    single JOIN.
    '''
    query = """
        SELECT mp.id, mp.match_id, mp.deck_id, mp.placement, mp.won
        FROM MatchPlayers mp
        JOIN Decks d ON d.deckid = mp.deck_id
        WHERE d.ownerid = :ownerid
    """
    rows = db.execute_query(query, {"ownerid": ownerid})
    if not rows:
        raise HTTPException(status_code=404, detail="No matches found for player's decks")
    return rows

@app.get("/matchplayers/{mp_id}", response_model=schemas.MatchPlayersResponse)
def get_match_player_by_id(mp_id: int):
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
            placement=mp.placement,
            won=mp.won
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
    
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))