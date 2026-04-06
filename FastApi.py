# FastApi.py


from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
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
    