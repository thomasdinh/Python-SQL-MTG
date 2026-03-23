# main.py


from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import database
import schemas

app = FastAPI()


# main.py
from fastapi import FastAPI

app = FastAPI()
db = database.DatabaseManager()

@app.get("/")
def root():
    return {"message": "Hello World"}

@app.get("/users/{user_id}")
def get_user(user_id: int):
    user = db.select(database.User, {"userid": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

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
    existing = db.select(database.User, {"userid": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    db.update(database.User, {"userid": user_id}, user)
    return existing