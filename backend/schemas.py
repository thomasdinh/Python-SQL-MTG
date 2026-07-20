from pydantic import BaseModel
from typing import Optional

# Used when CREATING a user (no userid yet, database generates it)
class UserCreate(BaseModel):
    userid: Optional[int] = None  # Optional because DB will auto-generate
    firstname: str
    lastname: str
    
# Used when READING a user (includes userid from database)
#https://docs.pydantic.dev/latest/concepts/models/#error-handling
class UserResponse(BaseModel):
    userid: int
    firstname: str
    lastname: str

    class Config:
        from_attributes = True  # tells Pydantic to read SQLAlchemy objects

class MtgMatchRequest(BaseModel):
    match_id: Optional[int] = None  # Optional because DB will auto-generate
    Decklist: str
    match_result: str
    date: str
    group_id: int
    comment: Optional[str] = None  # comment can be null

class MtgMatchesResponse(BaseModel):
    match_id: int
    Decklist: str
    match_result: str
    date: str
    group_id: int
    comment: Optional[str] = None  # comment can be null

    class Config:
        from_attributes = True

class DeckRequest(BaseModel):
    deckid: Optional[int] = None  # Optional because DB will auto-generate
    deckname: str
    partnername: Optional[str] = None
    color: Optional[str] = None
    manavalue: Optional[int] = None
    ownerid: int
    image_url: Optional[str] = None

class DeckResponse(BaseModel):
    deckid: int
    deckname: str
    partnername: Optional[str] = None
    color: Optional[str] = None
    manavalue: Optional[int] = None
    ownerid: int
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

class MatchPlayerRequest(BaseModel):
    id: Optional[int] = None  # Optional because DB will auto-generate
    match_id: int
    deck_id: int
    placement: int
    won: int

class MatchPlayersResponse(BaseModel):
    id: int
    match_id: int
    deck_id: int
    placement: int
    won: int


# ── Aggregate / batch response models ──────────────────────────────────────
# These back endpoints that join data server-side so the frontend can render
# a page with ONE request instead of firing one request per row (N+1).

class DeckWithStatsResponse(BaseModel):
    """A deck plus its aggregated match record, computed in a single SQL query."""
    deckid: int
    deckname: str
    partnername: Optional[str] = None
    color: Optional[str] = None
    manavalue: Optional[int] = None
    ownerid: int
    image_url: Optional[str] = None
    matches: int
    wins: int
    last_played: Optional[str] = None


class MatchDetailPlayer(BaseModel):
    id: int
    deck_id: int
    deck_name: str
    owner_id: int
    placement: int
    won: int


class MatchDetailResponse(BaseModel):
    match_id: int
    date: str
    group_id: Optional[int] = None
    comment: Optional[str] = None
    players: list[MatchDetailPlayer]


class DeckMatchHistoryEntry(BaseModel):
    """One row of a deck's match history: the match-player result joined with
    the match's own date/comment, so the frontend doesn't need a second
    fetch per match to display it."""
    id: int
    match_id: int
    placement: int
    won: int
    date: str
    comment: Optional[str] = None