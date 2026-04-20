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

# JS
# `.map()` in JavaScript

## What it is

`.map()` is a method that lives on every array. It loops over every item, runs a function on it, and returns a **brand new array** of the results. The original array is never changed.

The core idea in one line:

```js
const newArray = oldArray.map((item) => doSomethingWith(item))
```

---

## The simplest possible example

```js
const numbers = [1, 2, 3, 4]

const doubled = numbers.map((num) => num * 2)

console.log(doubled) // [2, 4, 6, 8]
console.log(numbers) // [1, 2, 3, 4]  ← unchanged
```

The function you pass to `.map()` receives one item at a time. Whatever you return from that function becomes the item in the new array.

---

## With objects — more like your real data

```js
const decks = [
  { deckid: 1, deckname: 'Atraxa Superfriends', color: 'WUBG' },
  { deckid: 2, deckname: 'Krenko Goblins',      color: 'R'    },
  { deckid: 3, deckname: 'Muldrotha Graveyard', color: 'BUG'  },
]

const names = decks.map((deck) => deck.deckname)

console.log(names) // ['Atraxa Superfriends', 'Krenko Goblins', 'Muldrotha Graveyard']
```

You give it an array of objects, you get back an array of just the field you wanted. `.map()` always returns an array of the same length — one output item per input item.

---

## The anatomy of a `.map()` call

```js
decks.map((deck) => deck.deckname)
//    ↑           ↑
//    |           the function runs once per item
//    called on the array
```

The variable name in the parentheses (`deck`) is just a name you choose. It represents one item from the array on each loop. You could call it `x`, `item`, `d` — it doesn't matter, but naming it after what it contains makes the code readable.

---

## In React — rendering a list of components

This is where you'll use `.map()` the most. Instead of returning a string or number, you return JSX:

```jsx
const decks = [
  { deckid: 1, deckname: 'Atraxa Superfriends', color: 'WUBG' },
  { deckid: 2, deckname: 'Krenko Goblins',      color: 'R'    },
]

function App() {
  return (
    <div>
      {decks.map((deck) => (
        <DeckCard key={deck.deckid} deck={deck} />
      ))}
    </div>
  )
}
```

React sees the array of JSX elements that `.map()` returns and renders all of them. This is the standard way to render any list in React — there is no `for` loop equivalent in JSX.

The `key` prop is required when you do this. React uses it internally to track which component corresponds to which item, especially when the list changes. Always use a stable unique ID like `deck.deckid`, never the array index if you can avoid it.

---

## Comparison: `.map()` vs a `for` loop

A regular `for` loop is a statement — it does something but doesn't produce a value you can use inline:

```js
// for loop — you have to build the array yourself
const names = []
for (let i = 0; i < decks.length; i++) {
  names.push(decks[i].deckname)
}
```

`.map()` is an expression — it produces a value directly, which is why you can drop it right inside JSX with `{}`:

```js
// map — one line, returns the array directly
const names = decks.map((deck) => deck.deckname)
```

---

## The two other array methods you'll use alongside it

Once you have `.map()` down, these two follow naturally.

`.filter()` — returns a new array containing only the items where the function returns `true`:

```js
const redDecks = decks.filter((deck) => deck.color === 'R')
// only Krenko survives
```

`.find()` — returns the first single item where the function returns `true` (not an array):

```js
const atraxa = decks.find((deck) => deck.deckid === 1)
// { deckid: 1, deckname: 'Atraxa Superfriends', color: 'WUBG' }
```

You'll commonly chain `.filter()` and `.map()` together — first narrow down the list, then transform it:

```js
// get names of all multi-color decks
const multiColorNames = decks
  .filter((deck) => deck.color.length > 1)
  .map((deck) => deck.deckname)

// ['Atraxa Superfriends', 'Muldrotha Graveyard']
```

---

## Quick mental checklist

When you see `.map()`, ask yourself:

- What array am I starting with?
- What do I want each item to become?
- What array do I get back?

That's all `.map()` ever does — transform every item in one array into a new array of the same length. 

# Tailwind CSS basics

## What Tailwind is

Tailwind is a utility-first CSS framework. Instead of writing a separate `.css` file, you apply small single-purpose classes directly in your JSX. Each class does exactly one thing.

```jsx
<div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 items-center">
```

---

## Spacing

| Class | What it does |
|-------|-------------|
| `p-4` | Padding on all sides. 4 = 1rem = 16px |
| `p-8` | Padding on all sides. 8 = 2rem = 32px |
| `px-4` | Padding left and right only |
| `py-4` | Padding top and bottom only |
| `mt-2` | Margin top |
| `mb-6` | Margin bottom |
| `gap-3` | Space between children in a flex or grid container |

Tailwind uses a spacing scale where each step is 4px. So `p-1` = 4px, `p-2` = 8px, `p-4` = 16px, `p-8` = 32px.

---

## Layout — flexbox

| Class | What it does |
|-------|-------------|
| `flex` | Makes a container use flexbox. Children line up in a row by default |
| `flex-col` | Makes flex go vertically instead of horizontally |
| `items-center` | Vertically centers children in a flex row |
| `justify-between` | Pushes children to opposite ends of the container |
| `flex-1` | Makes an element grow to fill all available space |
| `flex-shrink-0` | Prevents an element from shrinking (use on icons to keep them square) |
| `min-w-0` | Lets text truncate properly inside a flex child — a common flex quirk fix |
| `gap-3` | Space between flex children |

### Layout — grid

| Class | What it does |
|-------|-------------|
| `grid` | Makes a container use CSS grid |
| `grid-cols-2` | Two equal columns |
| `grid-cols-3` | Three equal columns |

Switching from a vertical list to a two-column grid is one class swap:

```jsx
<div className="flex flex-col gap-3">   {/* vertical list */}
<div className="grid grid-cols-2 gap-3"> {/* two-column grid */}
```

---

## Sizing

| Class | What it does |
|-------|-------------|
| `w-14` | Width. 14 = 3.5rem = 56px |
| `h-14` | Height. Same scale as width |
| `w-full` | Width 100% of the parent |
| `max-w-md` | Maximum width 448px |
| `min-h-screen` | Minimum height fills the entire viewport |

---

## Appearance

### Background colours
```jsx
bg-white         // white
bg-gray-100      // very light gray (good for page backgrounds)
bg-purple-100    // light purple (good for subtle highlights)
```

Tailwind colour scale: `100` is lightest, `900` is darkest. `50` is even lighter than `100`.

### Borders
```jsx
border              // adds a 1px border
border-gray-200     // sets the border colour to light gray
rounded-lg          // border radius, moderately rounded
rounded-xl          // border radius, more rounded
rounded-full        // fully round (circle/pill)
```

### Text
```jsx
text-sm          // small font (14px)
text-base        // default font (16px)
text-lg          // large (18px)
text-2xl         // 24px
text-3xl         // 30px

font-medium      // font weight 500
font-bold        // font weight 700

text-gray-900    // near black — use for headings
text-gray-500    // medium gray — use for secondary text
text-gray-400    // light gray — use for hints/placeholders

truncate         // cuts text off with ... if it overflows (needs min-w-0 on parent in flex)
```

---

## className vs class

In React, you write `className` instead of `class`. This is because `class` is a reserved word in JavaScript.

```jsx
// ✅ correct in React
<div className="bg-white p-4">

// ❌ wrong in React (works in plain HTML but not JSX)
<div class="bg-white p-4">
```

---

## The `??` operator (not Tailwind, but used alongside it)

The `??` (nullish coalescing) operator means "use this value, but if it is null or undefined, use the fallback instead". You will use it constantly when rendering optional fields from your API.

```jsx
{deck.color ?? 'Colorless'}
// if deck.color is null or undefined → shows 'Colorless'
// if deck.color is 'WUBG' → shows 'WUBG'

{deck.manavalue ?? '—'}
// if deck.manavalue is null → shows '—'
// if deck.manavalue is 3 → shows 3
```

---

## The DeckCard we built

```jsx
function DeckCard({ deck }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 items-center">
      <div className="bg-purple-100 rounded-lg w-14 h-14 flex items-center justify-center text-2xl flex-shrink-0">
        🃏
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-medium text-gray-900 truncate">
          {deck.deckname}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {deck.color ?? 'Colorless'} · MV {deck.manavalue ?? '—'}
        </p>
      </div>
    </div>
  )
}
```

Reading it left to right: white card, light border, rounded corners, padding, flex row, gap between children. Icon box: light purple background, rounded, fixed 56×56px size, centered content, won't shrink. Text area: grows to fill space, allows truncation.

---

## Quick reference — classes used most often

```
Layout:     flex  flex-col  grid  grid-cols-2  items-center  justify-between  gap-4
Spacing:    p-4  px-4  py-2  mt-2  mb-4
Sizing:     w-full  h-14  max-w-md  min-h-screen
Text:       text-sm  text-base  font-medium  text-gray-900  text-gray-500  truncate
Background: bg-white  bg-gray-100  bg-purple-100
Border:     border  border-gray-200  rounded-xl  rounded-lg
```
# React fundamentals — useState, useEffect, fetch, and state flow

---

## useState

### What it is

`useState` gives a component memory. A regular variable resets every time React re-renders the component. State persists across renders — when you update it, React re-renders the component with the new value.

```jsx
const [value, setValue] = useState(startingValue)
```

- `value` — the current value, use this to read
- `setValue` — the function to update it, use this to write
- `startingValue` — what it is before anything happens

### Examples

```jsx
const [decks, setDecks] = useState([])          // starts as empty array
const [loading, setLoading] = useState(true)     // starts as true
const [error, setError] = useState(null)         // starts as null
const [selectedId, setSelectedId] = useState(null)
```

### The golden rule

**Never modify state directly.** Always go through the setter function.

```jsx
// ❌ wrong — React won't notice this change
decks.push(newDeck)

// ✅ correct — React sees the update and re-renders
setDecks([...decks, newDeck])
```

### Re-rendering

Every time you call a setter, React re-runs the component function with the new value. This is how your UI stays in sync with your data.

```
setDecks(data)
    ↓
React re-renders the component
    ↓
{decks.map(...)} now produces the new cards
    ↓
Browser updates
```

---

## useEffect

### What it is

`useEffect` lets you run code in response to something happening — a component loading, or a piece of state changing. Without it there is no safe place to call `fetch` inside a React component.

```jsx
useEffect(() => {
  // code to run
}, [dependencies])
```

### The dependency array

The second argument controls when the effect re-runs:

```jsx
useEffect(() => {
  // runs once when the component first loads, never again
}, [])

useEffect(() => {
  // runs when the component loads AND every time selectedPlayerId changes
}, [selectedPlayerId])

useEffect(() => {
  // runs after every single render — almost never what you want
})
```

### The most common pattern — fetch on load

```jsx
useEffect(() => {
  fetch('http://localhost:8000/decks_by_player/1')
    .then((res) => res.json())
    .then((data) => setDecks(data))
    .catch((err) => setError(err.message))
}, [])
```

### Re-fetching when something changes

```jsx
useEffect(() => {
  if (selectedPlayerId === null) return  // guard — don't fetch if nothing selected

  setLoading(true)
  setDecks([])

  fetch(`http://localhost:8000/decks_by_player/${selectedPlayerId}`)
    .then((res) => res.json())
    .then((data) => {
      setDecks(data)
      setLoading(false)
    })
    .catch((err) => {
      setError(err.message)
      setLoading(false)
    })
}, [selectedPlayerId])  // re-runs every time selectedPlayerId changes
```

---

## fetch and async data

### What fetch returns

`fetch` does not return data immediately — it returns a **Promise**. A Promise is a value that says "I don't have the result yet, but I will". You handle it with `.then()`.

```jsx
fetch(url)                        // returns a Promise
  .then((response) => response.json())  // parse the raw response as JSON
  .then((data) => {               // data is now your actual JavaScript object
    setDecks(data)
    setLoading(false)
  })
  .catch((err) => {               // anything going wrong lands here
    setError(err.message)
    setLoading(false)
  })
```

### The three states of a fetch

Every fetch in your app should handle all three outcomes:

```jsx
const [data, setData]       = useState([])
const [loading, setLoading] = useState(true)
const [error, setError]     = useState(null)

// In JSX:
if (loading) return <p>Loading...</p>
if (error)   return <p>Error: {error}</p>
return <div>{data.map(...)}</div>
```

### GET vs POST

```jsx
// GET — reading data (default, no options needed)
fetch('http://localhost:8000/decks_by_player/1')

// POST — sending data to create something
fetch('http://localhost:8000/decks/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    deckname: 'Atraxa Superfriends',
    color: 'WUBG',
    manavalue: 3,
    ownerid: 1
  })
})

// DELETE — removing something
fetch('http://localhost:8000/decks/1', {
  method: 'DELETE'
})
```

---

## State flow and lifting state up

### The problem

Two components that need to share data cannot talk directly to each other. In React, data only flows one way — downward from parent to child via props.

```
PlayerSelector wants to SET the selected player
DeckList wants to READ the selected player

They are siblings — neither is the parent of the other.
They cannot communicate directly.
```

### The solution — lift state up to the shared parent

Move the state into the closest parent that contains both components. Pass the value down to the reader, and the setter down to the writer.

```
App  ← owns selectedPlayerId state
├── PlayerSelector  ← receives onSelect (the setter)
└── DeckList        ← receives selectedPlayerId (the value)
```

```jsx
// App.jsx — owns the state
function App() {
  const [selectedPlayerId, setSelectedPlayerId] = useState(null)

  return (
    <div>
      <PlayerSelector onSelect={setSelectedPlayerId} />
      <DeckList playerId={selectedPlayerId} />
    </div>
  )
}
```

```jsx
// PlayerSelector.jsx — calls the setter when user clicks
function PlayerSelector({ onSelect }) {
  return (
    <button onClick={() => onSelect(1)}>
      Player One
    </button>
  )
}
```

```jsx
// DeckList.jsx — reads the value
function DeckList({ playerId }) {
  return <p>Showing decks for player {playerId}</p>
}
```

### The full data flow diagram

```
User clicks a player button
        ↓
onClick={() => onSelect(player.userid)} fires in PlayerSelector
        ↓
onSelect is actually setSelectedPlayerId from App
        ↓
selectedPlayerId state in App updates
        ↓
App re-renders, passes new selectedPlayerId down to DeckList
        ↓
useEffect in DeckList sees selectedPlayerId changed
        ↓
New fetch fires to /decks_by_player/{selectedPlayerId}
        ↓
setDecks(data) called with new decks
        ↓
DeckList re-renders showing the new player's decks
```

### Passing functions as props

You can pass any JavaScript value as a prop — including functions. This is how children communicate back up to parents.

```jsx
// passing the setter directly
<PlayerSelector onSelect={setSelectedPlayerId} />

// or wrapping it in a custom function if you need to do more
<PlayerSelector onSelect={(id) => {
  setSelectedPlayerId(id)
  setDecks([])         // also reset decks when player changes
}} />
```

---

## The backend problem — fetching all users

Your FastAPI backend only has `GET /users/{user_id}` — one user at a time. It has no `GET /users` endpoint that returns all users. This is why trying to fetch all players at once doesn't work.

### Two ways to solve it

**Option 1 — add the endpoint to FastAPI (recommended):**

```python
@app.get("/users/", response_model=List[schemas.UserResponse])
def get_all_users():
    users = db.select(database.User, {})
    return users
```

Then in React:
```jsx
fetch(`${API_BASE}/users/`)
  .then((res) => res.json())
  .then((data) => setPlayers(data))
```

**Option 2 — fetch a range of IDs in parallel (workaround):**

```jsx
const ids = [1, 2, 3, 4, 5]

Promise.all(
  ids.map((id) =>
    fetch(`${API_BASE}/users/${id}`)
      .then((res) => res.ok ? res.json() : null)
      .catch(() => null)
  )
).then((results) => {
  const found = results.filter((user) => user !== null)
  setPlayers(found)
})
```

`Promise.all` fires all the fetches at the same time and waits for all of them to finish. The `.filter((user) => user !== null)` removes the ones that returned 404.

Option 1 is cleaner — add the endpoint to your backend and you're done.

---

## Quick reference

```
useState(initial)        → [value, setValue]
useEffect(fn, [])        → run once on load
useEffect(fn, [x])       → run when x changes
fetch(url)               → GET request
fetch(url, {method, headers, body}) → POST/PUT/DELETE
Promise.all([...])       → run multiple fetches in parallel
lifting state up         → move state to shared parent, pass setter down
```