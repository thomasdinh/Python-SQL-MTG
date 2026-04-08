
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

class MatchPlayerResponse(BaseModel):
    id: int
    match_id: int
    deck_id: int
    placement: int

    class Config:
        from_attributes = True

class MatchPlayersResponse(BaseModel):
    id: int
    match_id: int
    deck_id: int
    placement: int
    won: int


class MatchPlayersRequest(BaseModel):
    id: Optional[int] = None  # Optional because DB will auto-generate
    match_id: int
    deck_id: int
    placement: int
    won: int

    class Config:
        from_attributes = True
