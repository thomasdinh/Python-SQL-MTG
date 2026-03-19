# main.py
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

app = FastAPI()


# main.py
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Hello World"}

@app.get("/items/{item_id}")
def get_item(item_id: int):
    return {"item_id": item_id}