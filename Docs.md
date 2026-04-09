# Lessons learned by programming this project

## Pydantic and SQLAlchemy: Configuration and Session Management

---


## 1. How Pydantic Works with SQLAlchemy Objects

SQLAlchemy returns **objects**, not dictionaries.
For example, you access attributes like this:

```python
user.userid    # attribute access, not a dictionary key
user.firstname
```

## 1. Pydantic’s `Config` Class

The `Config` inner class in Pydantic allows you to customize how Pydantic models interact with your data.

### Key Setting: `from_attributes = True`

- **Default Behavior**:
  Pydantic expects plain dictionaries:
  ```python
  {"userid": 1, "firstname": "John"}



### 2. The Role of `from_attributes = True`

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


## 3. Fixes to session bound errors
How to fix Error occurred: Instance <User at 0x7ffacf2e9fa0> is not bound to a Session; attribute refresh operation cannot proceed (Background on this error at: https://sqlalche.me/e/20/bhk3) - this needs `flush()`

127.0.0.1:56328 - "POST /users/ HTTP/1.1" 500 Internal Server Error - this needs the dict


`flush()` sends the SQL to MySQL while the session is still open, so userid gets generated before the session closes.

```
session.add(record)     # stage
session.flush()         # write to MySQL, get userid ← key step 1
session.refresh(record) # read userid back into object
return dict(...)        # copy to plain dict before session closes ← key step 2
```
## 4. Context Manager
[Context Manager Video](https://www.youtube.com/watch?v=LBJlGwJ899Y)

## 5. @m insertion in SQL
# MySQL Session Variables & `LAST_INSERT_ID()`

## What is a session variable?

In MySQL, any variable prefixed with `@` is a **user-defined session variable**.

- It is created on the fly — no `DECLARE` needed
- It lives only for the duration of your **current connection**
- It is invisible to other users/connections
- It can hold a number, string, or NULL

```sql
SET @my_variable = 42;
SELECT @my_variable;  -- returns 42
```

---

## The pattern used in the migration

```sql
-- Step 1: Insert a new match row
INSERT INTO Matches (played_at, group_id)
VALUES (STR_TO_DATE('07.04.25', '%d.%m.%y'), 0);

-- Step 2: Save the auto-generated ID immediately
SET @m = LAST_INSERT_ID();

-- Step 3: Use @m in every related MatchPlayers row
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ixhel'  LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Temmet' LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Edgar'  LIMIT 1), 3, 0);
```

### Why each step matters

| Step | What happens |
|------|-------------|
| `INSERT INTO Matches` | MySQL auto-generates a new `match_id` via `AUTO_INCREMENT` |
| `LAST_INSERT_ID()` | Returns that freshly generated ID — from **your connection only** |
| `SET @m = ...` | Stores it in a variable so you can reuse it |
| `@m` in INSERT | All MatchPlayer rows now correctly point to the same match |

---

## Why not just use `SELECT MAX(match_id)`?

```sql
-- ❌ Dangerous — don't do this
SET @m = (SELECT MAX(match_id) FROM Matches);
```

This breaks in multi-user environments. If another user inserts a match at
the same moment, `MAX(match_id)` returns *their* ID, not yours.

`LAST_INSERT_ID()` is **connection-scoped** — it always reflects your last
insert, no matter what other connections are doing.

---

## Naming your variables

The name `@m` is just a short convenience. These are all equivalent:

```sql
SET @m            = LAST_INSERT_ID();  -- used in the migration (short)
SET @match_id     = LAST_INSERT_ID();  -- more descriptive
SET @last_match   = LAST_INSERT_ID();  -- equally valid
```

Pick names that make your intent clear. `@m` is fine in a migration script
where each block is self-contained.

---

## The equivalent in your FastAPI backend

In Python you would never write this raw SQL pattern. Your database driver
returns the inserted ID directly:

**With raw `mysql-connector-python`:**
```python
cursor.execute(
    "INSERT INTO Matches (played_at, group_id) VALUES (%s, %s)",
    ("2025-04-07", 0)
)
match_id = cursor.lastrowid  # equivalent to LAST_INSERT_ID()
```

**With SQLAlchemy ORM:**
```python
match = Match(played_at=date(2025, 4, 7), group_id=0)
db.add(match)
db.flush()          # writes to DB but doesn't commit yet
match_id = match.match_id  # ORM populates this automatically after flush
```

**With SQLAlchemy Core (execute):**
```python
result = db.execute(insert(Matches).values(played_at=..., group_id=0))
match_id = result.inserted_primary_key[0]
```

---

## Quick-reference cheat sheet

```sql
-- Create / update a session variable
SET @x = 100;

-- Read it back
SELECT @x;

-- Use inside a query
SELECT * FROM Matches WHERE match_id = @x;

-- Capture the last auto-increment ID
SET @new_id = LAST_INSERT_ID();

-- Variables are gone when your connection closes
-- Other connections can never see your @variables
```

---

## Common mistakes to avoid

| Mistake | Problem | Fix |
|---------|---------|-----|
| Using `SELECT MAX(id)` instead of `LAST_INSERT_ID()` | Race condition in multi-user DB | Always use `LAST_INSERT_ID()` |
| Forgetting `SET @m = LAST_INSERT_ID()` between inserts | `@m` still holds the previous match ID | Always set it right after each `INSERT INTO Matches` |
| Using `@variable` in stored procedures | Scope confusion with local variables | Use `DECLARE v INT;` for local proc variables instead |
| Relying on `@m` across separate connections | Session variables don't persist between connections | Only use within one continuous session/script |

# Python: Dictionary vs Object

## 1. Dictionary (`dict`)
A dictionary is a built-in Python data structure that stores **key-value pairs**.
You access values using **square brackets** and the key.

**Example:**
```python
# Define a dictionary
person_dict = {
    'name': 'Alice',
    'age': 30,
    'city': 'Berlin'
}

# Access values
print(person_dict['name'])  # Output: Alice
print(person_dict['age'])   # Output: 30
```

- **Pros:** Simple, flexible, no need for class definition.
- **Cons:** No methods or behavior, just data.

---

## 2. Object (Class Instance)
An object is an instance of a **class**.
You define a class with attributes and methods, and access attributes using **dot notation**.

**Example:**
```python
# Define a class
class Person:
    def __init__(self, name, age, city):
        self.name = name
        self.age = age
        self.city = city

# Create an object
person_obj = Person('Alice', 30, 'Berlin')

# Access attributes
print(person_obj.name)  # Output: Alice
print(person_obj.age)   # Output: 30
```

- **Pros:** Can have methods (functions), supports inheritance, more structured.
- **Cons:** Requires class definition, more verbose.

---

## Key Differences
   Feature         | Dictionary (`dict`)         | Object (Class Instance)      |
 |-----------------|-----------------------------|------------------------------|
 | **Syntax**      | `{'key': value}`            | `class MyClass: ...`         |
 | **Access**      | `d['key']`                  | `obj.key`                    |
 | **Methods**     | No (unless you add them)    | Yes (defined in class)       |
 | **Flexibility** | Very flexible, dynamic      | Structured, type-safe        |
 | **Use Case**    | Simple data storage         | Complex logic and behavior  |

---

## When to Use Which
- Use a **dictionary** for simple, flexible data storage.
- Use an **object** when you need behavior (methods) or structure.
