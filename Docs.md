# Pydantic and SQLAlchemy: Configuration and Session Management

---

## 1. Pydantic’s `Config` Class

The `Config` inner class in Pydantic allows you to customize how Pydantic models interact with your data.

### Key Setting: `from_attributes = True`

- **Default Behavior**:
  Pydantic expects plain dictionaries:
  ```python
  {"userid": 1, "firstname": "John"}

SQLAlchemy returns objects, not dicts:
pythonuser.userid    # accessed as attribute, not dict key
user.firstname
from_attributes = True tells Pydantic "also accept objects where you read values via dot notation" — so it can read your SQLAlchemy model directly without you manually converting it.


How to fix Error occurred: Instance <User at 0x7ffacf2e9fa0> is not bound to a Session; attribute refresh operation cannot proceed (Background on this error at: https://sqlalche.me/e/20/bhk3) - this needs flush

127.0.0.1:56328 - "POST /users/ HTTP/1.1" 500 Internal Server Error - this needs the dict


flush() sends the SQL to MySQL while the session is still open, so userid gets generated before the session closes.

session.add(record)     # stage
session.flush()         # write to MySQL, get userid ← key step 1
session.refresh(record) # read userid back into object
return dict(...)        # copy to plain dict before session closes ← key step 2

