#Lessons learned by programming this project

## Pydantic and SQLAlchemy: Configuration and Session Management

---

## 1. Pydantic’s `Config` Class

The `Config` inner class in Pydantic allows you to customize how Pydantic models interact with your data.

### Key Setting: `from_attributes = True`

- **Default Behavior**:
  Pydantic expects plain dictionaries:
  ```python
  {"userid": 1, "firstname": "John"}

## How Pydantic Works with SQLAlchemy Objects

SQLAlchemy returns **objects**, not dictionaries.
For example, you access attributes like this:

```python
user.userid    # attribute access, not a dictionary key
user.firstname
```

### The Role of `from_attributes = True`

Example use Case:
```
#https://docs.pydantic.dev/latest/concepts/models/#error-handling
class UserResponse(BaseModel):
    userid: int
    firstname: str
    lastname: str

    class Config:
        from_attributes = True  # tells Pydantic to read SQLAlchemy objects
```

By default, Pydantic expects plain dictionaries.
Setting `from_attributes = True` in your Pydantic model’s `Config` tells Pydantic:

> "Also accept objects where values are read via dot notation."

This allows Pydantic to **directly read your SQLAlchemy model** without requiring manual conversion to a dictionary.



How to fix Error occurred: Instance <User at 0x7ffacf2e9fa0> is not bound to a Session; attribute refresh operation cannot proceed (Background on this error at: https://sqlalche.me/e/20/bhk3) - this needs `flush()`

127.0.0.1:56328 - "POST /users/ HTTP/1.1" 500 Internal Server Error - this needs the dict


`flush()` sends the SQL to MySQL while the session is still open, so userid gets generated before the session closes.

```
session.add(record)     # stage
session.flush()         # write to MySQL, get userid ← key step 1
session.refresh(record) # read userid back into object
return dict(...)        # copy to plain dict before session closes ← key step 2
```


