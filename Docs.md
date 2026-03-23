class Config in Pydantic
It's a special inner class that controls how Pydantic behaves for that schema. Think of it as settings for the schema itself, not the data.

from_attributes = True in detail
Without it, Pydantic only understands plain dictionaries:
python{"userid": 1, "firstname": "John"}  # works by default
SQLAlchemy returns objects, not dicts:
pythonuser.userid    # accessed as attribute, not dict key
user.firstname
from_attributes = True tells Pydantic "also accept objects where you read values via dot notation" — so it can read your SQLAlchemy model directly without you manually converting it.

