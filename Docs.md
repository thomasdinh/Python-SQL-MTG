# Lessons learned

A personal reference built while developing the MTG Commander Dashboard — a full-stack project using MySQL, FastAPI (Python), and React (TypeScript).

---

## Table of contents

1. [Glossary](#glossary)
2. [Python & backend](#python--backend)
   - [Pydantic and SQLAlchemy](#pydantic-and-sqlalchemy)
   - [Session management and flush](#session-management-and-flush)
   - [Dictionary vs object](#dictionary-vs-object)
3. [MySQL](#mysql)
   - [Session variables and LAST_INSERT_ID()](#session-variables-and-last_insert_id)
4. [JavaScript fundamentals](#javascript-fundamentals)
   - [.map()](#map)
   - [.filter() and .find()](#filter-and-find)
   - [The spread operator](#the-spread-operator)
   - [Optional chaining and nullish coalescing](#optional-chaining-and-nullish-coalescing)
   - [new Set()](#new-set)
   - [Promises and fetch](#promises-and-fetch)
5. [React](#react)
   - [Components and props](#components-and-props)
   - [useState](#usestate)
   - [useEffect](#useeffect)
   - [Lifting state up](#lifting-state-up)
   - [Passing functions as props](#passing-functions-as-props)
   - [Controlled forms and POST requests](#controlled-forms-and-post-requests)
   - [DELETE requests](#delete-requests)
   - [Dependent fetches](#dependent-fetches)
   - [Toggle pattern](#toggle-pattern)
   - [Deriving stats from state](#deriving-stats-from-state)
6. [Tailwind CSS](#tailwind-css)
7. [Patterns and recipes](#patterns-and-recipes)

---

## Glossary

| Term | Definition |
|------|-----------|
| **API** | Application Programming Interface — a set of endpoints your backend exposes so the frontend can read and write data |
| **Attribute access** | Reading a value from an object using dot notation: `user.firstname` |
| **Boolean** | A value that is either `true` or `false` |
| **Component** | A reusable function in React that returns JSX and represents a piece of UI |
| **Controlled input** | A form input whose value is owned by React state, not the DOM |
| **CORS** | Cross-Origin Resource Sharing — a browser security rule that blocks requests from one domain to another unless the server allows it |
| **Dependent fetch** | A second API call that can only run after the first one finishes, because you need data from the first response |
| **Destructuring** | A JavaScript shortcut to unpack values from arrays or objects into named variables |
| **DOM** | Document Object Model — the browser's internal representation of your HTML |
| **Expression** | Code that produces a value (e.g. `2 + 2`, `decks.map(...)`) |
| **Falsy** | A value that evaluates to `false` in a boolean context: `null`, `undefined`, `0`, `''`, `false` |
| **Hook** | A special React function (always starts with `use`) that lets you add state or side effects to a component |
| **JSX** | JavaScript XML — the HTML-like syntax you write inside React components |
| **Lifting state up** | Moving shared state to the nearest common parent component so multiple children can access it |
| **Lookup table** | An object keyed by ID used for fast access instead of searching an array every time |
| **Middleware** | Code that runs between a request arriving and your route handler running — used in FastAPI for CORS |
| **Mutation** | Directly modifying existing data — React cannot detect this, always create new data instead |
| **Nullish** | A value that is `null` or `undefined` specifically (stricter than falsy) |
| **ORM** | Object Relational Mapper — SQLAlchemy maps Python objects to database rows |
| **Promise** | A JavaScript object representing a value that does not exist yet but will arrive in the future |
| **Prop** | A value passed from a parent component to a child component |
| **Prop drilling** | Passing a prop through multiple layers of components to reach a deeply nested child |
| **Re-render** | React re-running a component function to produce updated UI, triggered by state changes |
| **Session (SQLAlchemy)** | A unit of work that tracks database objects — must stay open while you access attributes |
| **Session variable (MySQL)** | A `@variable` that lives only for your current database connection |
| **Side effect** | Anything that reaches outside of a function — network requests, timers, DOM changes |
| **State** | Data owned by a React component that persists across re-renders |
| **Statement** | Code that does something but does not produce a value (e.g. `for` loops, `if` blocks) |
| **Truthy** | Any value that evaluates to `true` in a boolean context — everything except falsy values |
| **Type annotation** | Declaring what type a variable holds — used in Python (`str`, `int`) and TypeScript |

---

## Python & backend

### Pydantic and SQLAlchemy

SQLAlchemy returns **objects**, not dictionaries. You access their values with dot notation:

```python
user.userid      # ✅ correct — attribute access
user['userid']   # ❌ wrong — dictionary syntax
```

#### from_attributes = True

By default Pydantic expects plain dictionaries. Setting `from_attributes = True` in a model's `Config` tells Pydantic to also accept objects where values are read via dot notation — allowing it to read SQLAlchemy models directly without manual conversion.

```python
class UserResponse(BaseModel):
    userid: int
    firstname: str
    lastname: str

    class Config:
        from_attributes = True  # accepts SQLAlchemy objects, not just dicts
```

---

### Session management and flush

**The error:**
```
Instance <User> is not bound to a Session; attribute refresh operation cannot proceed
```

This happens because SQLAlchemy needs an open session to read auto-generated values like `userid` after an insert. If the session closes before you read them, it crashes.

**The fix — flush before the session closes:**

```python
session.add(record)      # stage the object
session.flush()          # write to MySQL, generates the ID ← key step 1
session.refresh(record)  # read the generated ID back into the object
return dict(record)      # copy to plain dict before session closes ← key step 2
```

`flush()` sends the SQL to MySQL while the session is still open, so the auto-generated ID is available before the session ends.

---

### Dictionary vs object

| Feature | Dictionary (`dict`) | Object (class instance) |
|---------|--------------------|-----------------------|
| Syntax | `{'key': value}` | `class MyClass: ...` |
| Access | `d['key']` | `obj.key` |
| Methods | No | Yes |
| Flexibility | Dynamic, flexible | Structured, type-safe |
| Use case | Simple data storage | Complex logic and behaviour |

```python
# Dictionary
person = {'name': 'Alice', 'age': 30}
print(person['name'])   # Alice

# Object
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

person = Person('Alice', 30)
print(person.name)      # Alice
```

---

## MySQL

### Session variables and LAST_INSERT_ID()

A **session variable** (`@variable`) in MySQL is created on the fly, lives only for your current connection, and is invisible to other users.

#### The pattern

```sql
-- Step 1: insert a new match
INSERT INTO Matches (played_at, group_id)
VALUES (STR_TO_DATE('07.04.25', '%d.%m.%y'), 0);

-- Step 2: capture the auto-generated ID immediately
SET @m = LAST_INSERT_ID();

-- Step 3: use @m in every related row
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ixhel'  LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Temmet' LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Edgar'  LIMIT 1), 3, 0);
```

#### Why not SELECT MAX(id)?

```sql
-- ❌ dangerous — breaks in multi-user environments
SET @m = (SELECT MAX(match_id) FROM Matches);

-- ✅ safe — always returns YOUR last insert, regardless of other connections
SET @m = LAST_INSERT_ID();
```

`LAST_INSERT_ID()` is connection-scoped — it always reflects your last insert, not anyone else's.

#### The Python equivalent

```python
# SQLAlchemy ORM
match = Match(played_at=date(2025, 4, 7), group_id=0)
db.add(match)
db.flush()
match_id = match.match_id   # ORM populates this automatically after flush
```

---

## JavaScript fundamentals

### .map()

`.map()` loops over every item in an array, runs a function on it, and returns a **brand new array** of the results. The original is never changed.

```js
const numbers = [1, 2, 3, 4]
const doubled = numbers.map((num) => num * 2)
// [2, 4, 6, 8]
```

#### With objects

```js
const decks = [
  { deckid: 1, deckname: 'Atraxa', color: 'WUBG' },
  { deckid: 2, deckname: 'Krenko', color: 'R'    },
]

const names = decks.map((deck) => deck.deckname)
// ['Atraxa', 'Krenko']
```

#### In React — rendering lists

```jsx
{decks.map((deck) => (
  <DeckCard key={deck.deckid} deck={deck} />
))}
```

Always use a stable unique ID for `key`. Never use the array index if you can avoid it.

#### .map() vs a for loop

```js
// for loop — statement, builds array manually
const names = []
for (let i = 0; i < decks.length; i++) {
  names.push(decks[i].deckname)
}

// .map() — expression, returns array directly, works inline in JSX
const names = decks.map((deck) => deck.deckname)
```

---

### .filter() and .find()

`.filter()` returns a new array of only the items where the function returns `true`:

```js
const redDecks = decks.filter((deck) => deck.color === 'R')
```

`.find()` returns the first single item where the function returns `true` (not an array):

```js
const atraxa = decks.find((deck) => deck.deckid === 1)
```

#### Chaining

```js
const multiColorNames = decks
  .filter((deck) => deck.color.length > 1)  // narrow down
  .map((deck) => deck.deckname)              // transform
```

#### Removing an item by ID

```js
// remove the deck with deckid === 2
setDecks(decks.filter((deck) => deck.deckid !== 2))
```

---

### The spread operator

`...` unpacks an array or object into individual items. Used to create new arrays and objects without mutating the original.

```js
// adding to an array
setDecks([...decks, newDeck])   // ✅ new array
decks.push(newDeck)             // ❌ mutates — React won't notice

// copying an object with one field changed
const updated = { ...deck, deckname: 'New Name' }
```

---

### Optional chaining and nullish coalescing

**Optional chaining `?.`** — safely access a property that might be `undefined` or `null`:

```js
match?.date        // returns undefined instead of crashing if match is undefined
match?.details?.date  // safe at every step in a chain
```

**Nullish coalescing `??`** — use a fallback if the value is `null` or `undefined`:

```js
deck.color ?? 'Colorless'   // 'Colorless' only if color is null/undefined
deck.manavalue ?? '—'       // '—' only if manavalue is null/undefined
match?.date ?? '—'          // combine both for safe access with fallback
```

The difference between `??` and `||`:

```js
0 || 'fallback'    // 'fallback' — || triggers on any falsy value including 0
0 ?? 'fallback'    // 0          — ?? only triggers on null/undefined
```

---

### new Set()

`Set` only holds unique values. Spreading it back into an array gives you a deduplicated array:

```js
const ids = [1, 2, 2, 3, 3, 3]
const uniqueIds = [...new Set(ids)]
// [1, 2, 3]

// real use — unique match IDs before fetching
const uniqueMatchIds = [...new Set(matchPlayers.map((mp) => mp.match_id))]
```

---

### Promises and fetch

A **Promise** is a value that does not exist yet but will arrive in the future. `fetch` always returns a Promise.

```js
fetch(url)                            // returns a Promise
  .then((res) => res.json())          // parse the raw response as JSON
  .then((data) => {                   // data is your actual JavaScript object
    setDecks(data)
    setLoading(false)
  })
  .catch((err) => {                   // anything going wrong lands here
    setError(err.message)
    setLoading(false)
  })
```

#### fetch does not throw on 4xx/5xx

```js
// ❌ a 404 or 500 does NOT go to .catch() — you must check manually
.then((res) => {
  if (!res.ok) throw new Error('Request failed')
  return res.json()
})
```

#### Promise.all — parallel fetches

```js
Promise.all(
  matchIds.map((id) =>
    fetch(`/matches/${id}`)
      .then((res) => res.ok ? res.json() : null)
      .catch(() => null)
  )
).then((results) => {
  const found = results.filter((m) => m !== null)
})
```

Total time = slowest single request, not the sum of all.

---

## React

### Components and props

A component is a function that returns JSX. Props are values passed from parent to child — like function arguments.

```jsx
// defining a component
function DeckCard({ deck }) {
  return (
    <div>
      <h2>{deck.deckname}</h2>
      <p>{deck.color ?? 'Colorless'}</p>
    </div>
  )
}

// using it
<DeckCard deck={myDeck} />
```

`{ deck }` in the function signature is destructuring — it pulls `deck` out of the props object directly.

---

### useState

`useState` gives a component memory. State persists across re-renders — calling the setter triggers a re-render with the new value.

```jsx
const [value, setValue] = useState(startingValue)
```

```jsx
const [decks, setDecks]       = useState([])     // empty array
const [loading, setLoading]   = useState(true)   // boolean
const [error, setError]       = useState(null)   // null
const [selectedId, setId]     = useState(null)
```

**Never mutate state directly:**

```jsx
decks.push(newDeck)          // ❌ React won't see this
setDecks([...decks, newDeck]) // ✅ new array, React re-renders
```

---

### useEffect

`useEffect` runs code in response to something — a component loading or state changing. It is the safe place to call `fetch`.

```jsx
useEffect(() => {
  // code to run
}, [dependencies])
```

| Dependency array | When it runs |
|-----------------|-------------|
| `[]` | Once on first load only |
| `[selectedId]` | On load and every time `selectedId` changes |
| *(omitted)* | After every render — almost never what you want |

```jsx
// fetch once on load
useEffect(() => {
  fetch('/users/')
    .then((res) => res.json())
    .then((data) => setPlayers(data))
}, [])

// re-fetch when player changes
useEffect(() => {
  if (!selectedPlayerId) return   // guard clause
  setLoading(true)
  setDecks([])
  fetch(`/decks_by_player/${selectedPlayerId}`)
    .then((res) => res.status === 404 ? [] : res.json())
    .then((data) => { setDecks(data); setLoading(false) })
    .catch((err) => { setError(err.message); setLoading(false) })
}, [selectedPlayerId])
```

---

### Lifting state up

When two sibling components need to share data, move the state to their nearest common parent. Pass the value down to readers and the setter down to writers.

```
App  ← owns selectedPlayerId
├── PlayerSelector  ← receives onSelect (the setter)
└── DeckList        ← receives selectedPlayerId (the value)
```

```jsx
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

---

### Passing functions as props

You can pass any value as a prop — including functions. This is how children trigger changes in the parent.

```jsx
// parent passes its setter as a prop
<PlayerSelector onSelect={setSelectedPlayerId} />

// child receives and calls it
function PlayerSelector({ onSelect }) {
  return (
    <button onClick={() => onSelect(player.userid)}>
      {player.firstname}
    </button>
  )
}
```

`onSelect(player.userid)` inside the child is identical to calling `setSelectedPlayerId(player.userid)` back in the parent. The child does not know or care what the function does — it just calls it.

**These two are identical:**

```jsx
<PlayerSelector onSelect={setSelectedPlayerId} />
<PlayerSelector onSelect={(id) => setSelectedPlayerId(id)} />
```

---

### Controlled forms and POST requests

In a controlled form, React state owns the input value. Every keystroke updates state and the input displays what is in state.

```jsx
const [deckname, setDeckname] = useState('')

<input
  value={deckname}
  onChange={(e) => setDeckname(e.target.value)}
/>
```

**Full submit pattern:**

```jsx
function handleSubmit() {
  // 1. validate
  if (!deckname.trim()) { setError('Name required'); return }

  // 2. set loading
  setSubmitting(true)
  setError(null)

  // 3. POST
  fetch('/decks/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deckname: deckname.trim(),
      color: color.toUpperCase() || null,
      manavalue: manavalue ? parseInt(manavalue) : null,
      ownerid: playerId,
    })
  })
    .then((res) => {
      if (!res.ok) throw new Error('Failed to create deck')
      return res.json()
    })
    .then((newDeck) => {
      setDeckname('')           // reset form
      setSubmitting(false)
      setDecks([...decks, newDeck])  // append without re-fetching
    })
    .catch((err) => {
      setError(err.message)
      setSubmitting(false)
    })
}
```

**Notes:**
- `.trim()` removes whitespace so empty spaces don't pass validation
- `|| null` sends `null` instead of `''` for optional fields (matches Pydantic `Optional[str]`)
- `parseInt()` converts the string from the input to a number
- Always check `res.ok` — fetch does not throw on 4xx/5xx responses

---

### DELETE requests

```jsx
fetch(`/decks/${deck.deckid}`, { method: 'DELETE' })
  .then((res) => {
    if (!res.ok) throw new Error('Failed to delete')
    onDeckDeleted(deck.deckid)   // tell the parent
  })
```

Remove the item from state with `.filter()` — no re-fetch needed:

```jsx
function handleDeckDeleted(deletedId) {
  setDecks(decks.filter((deck) => deck.deckid !== deletedId))
}
```

---

### Dependent fetches

When the second fetch depends on data from the first, put it inside the first `.then()`:

```jsx
fetch(`/matches_by_deck/${deckId}`)           // step 1
  .then((res) => res.json())
  .then((mpData) => {
    const uniqueMatchIds = [...new Set(mpData.map((mp) => mp.match_id))]

    return Promise.all(                       // step 2 — runs after step 1
      uniqueMatchIds.map((id) =>
        fetch(`/matches/${id}`)
          .then((r) => r.ok ? r.json() : null)
          .catch(() => null)
      )
    )
  })
  .then((matchData) => {
    const matchMap = {}
    matchData.forEach((m) => { if (m) matchMap[m.match_id] = m })
    setMatches(matchMap)    // lookup table for instant access
    setLoading(false)
  })
```

**Building a lookup table** avoids scanning the array on every render:

```js
// before — scans the full array every time
const match = matchData.find((m) => m.match_id === mp.match_id)

// after — instant key lookup
const match = matchMap[mp.match_id]
```

---

### Toggle pattern

Show and hide content with a boolean state:

```jsx
const [showHistory, setShowHistory] = useState(false)

<button onClick={() => setShowHistory(!showHistory)}>
  {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
</button>

{showHistory && <MatchHistory deckId={deck.deckid} />}
```

`&&` renders the right side only when the left side is `true`. When `showHistory` is false, `MatchHistory` does not exist in the DOM — it does not fetch, does not use memory. The fetch only runs when the user opens it.

---

### Deriving stats from state

Compute values directly from existing state instead of storing them separately. They update automatically whenever the source data changes:

```jsx
const wins    = matchPlayers.filter((mp) => mp.won === 1).length
const total   = matchPlayers.length
const winRate = Math.round((wins / total) * 100)
```

No extra `useState` needed.

---

### Image with error fallback

Use state to track whether an image failed to load, and fall back to an icon:

```jsx
const [imgError, setImgError] = useState(false)
const showImage = deck.image_url && !imgError

{showImage ? (
  <img
    src={deck.image_url}
    alt={deck.deckname}
    className="w-full h-full object-cover"
    onError={() => setImgError(true)}
  />
) : (
  <Layers size={24} className="text-purple-400" />
)}
```

`onError` fires if the image URL is broken, missing, or not an image — swapping in the icon automatically.

---

## Tailwind CSS

Tailwind applies single-purpose utility classes directly in JSX. No separate CSS file needed.

### Spacing

| Class | What it does |
|-------|-------------|
| `p-4` | Padding all sides (1rem = 16px) |
| `px-4` | Padding left and right |
| `py-2` | Padding top and bottom |
| `mt-2` | Margin top |
| `mb-4` | Margin bottom |
| `gap-3` | Space between flex/grid children |

Scale: each step = 4px. `p-1`=4px, `p-2`=8px, `p-4`=16px, `p-8`=32px.

### Layout

| Class | What it does |
|-------|-------------|
| `flex` | Flexbox row |
| `flex-col` | Flexbox column |
| `items-center` | Vertically center children |
| `justify-between` | Push children to opposite ends |
| `flex-1` | Grow to fill available space |
| `flex-shrink-0` | Prevent shrinking |
| `min-w-0` | Allow text truncation inside flex |
| `grid grid-cols-2` | Two-column grid |

### Sizing and appearance

```
w-14 h-14       → 56×56px
w-full          → 100% width
max-w-md        → max width 448px
min-h-screen    → full viewport height

bg-white        → white background
bg-gray-100     → light gray (page backgrounds)
bg-purple-100   → light purple (highlights)

border border-gray-200  → 1px light gray border
rounded-xl              → rounded corners
overflow-hidden         → clip content to rounded corners

text-sm / text-base / text-2xl  → font sizes
font-medium                     → weight 500
text-gray-900 / 500 / 400       → dark / medium / light text
truncate                        → overflow ellipsis (needs min-w-0 on flex parent)
```

### Conditional classes

```jsx
className={`text-sm font-medium ${winRate >= 50 ? 'text-green-600' : 'text-red-500'}`}
```

### State-based classes

```jsx
disabled:opacity-50        // applies when element is disabled
disabled:cursor-not-allowed
hover:text-red-500         // applies on hover
transition-colors          // smooth color transitions
```

### className not class

```jsx
<div className="bg-white p-4">   // ✅ React
<div class="bg-white p-4">       // ❌ plain HTML only
```

---

## Patterns and recipes

### Three-state fetch pattern

Every data fetch should handle loading, error, and success:

```jsx
const [data, setData]       = useState([])
const [loading, setLoading] = useState(true)
const [error, setError]     = useState(null)

if (loading) return <p>Loading...</p>
if (error)   return <p>Error: {error}</p>
return <div>{data.map(...)}</div>
```

### Safe array rendering

Always guard against undefined before accessing `.length`:

```jsx
if (!decks || decks.length === 0) return <p>No decks found.</p>
```

### Handle 404 as empty array

FastAPI returns 404 when a list is empty. React expects an empty array, not an error:

```jsx
.then((res) => {
  if (res.status === 404) return []
  if (!res.ok) throw new Error('Request failed')
  return res.json()
})
```

### Fragment — return multiple elements

```jsx
return (
  <>
    <AddDeckForm />
    <DeckList />
  </>
)
```

### Append / remove without re-fetching

```jsx
// append after POST
setDecks([...decks, newDeck])

// remove after DELETE
setDecks(decks.filter((d) => d.deckid !== deletedId))
```

### Disable button during async operation

```jsx
<button
  onClick={handleSubmit}
  disabled={submitting}
  className="bg-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
>
  {submitting ? 'Saving...' : 'Save'}
</button> 
```

Charts and data transformation

Recharts — the basics
Recharts is a chart library for React where every chart is built from JSX components. There are no configuration objects or setup functions — you compose charts the same way you compose any other React UI.
Install it:
bashnpm install recharts

The anatomy of every Recharts chart
Every chart follows the same layered structure:
jsx<ResponsiveContainer width="100%" height={240}>   // 1. responsive wrapper
  <BarChart data={data}>                           // 2. chart type + data
    <CartesianGrid strokeDasharray="3 3" />        // 3. background grid
    <XAxis dataKey="name" />                       // 4. horizontal axis
    <YAxis />                                      // 5. vertical axis
    <Tooltip />                                    // 6. hover popup
    <Bar dataKey="winRate" />                      // 7. the visual element
  </BarChart>
</ResponsiveContainer>
What each layer does
ComponentPurposeResponsiveContainerMakes the chart fill its parent's width. Always wrap your chart in this.BarChart / LineChartThe chart type. Receives your data array as a prop.CartesianGridBackground grid lines. strokeDasharray="3 3" makes them dashed.XAxisThe horizontal axis. dataKey tells it which field in your data to use as labels.YAxisThe vertical axis. Scales automatically to your data range.TooltipA popup that appears when you hover over a data point.Bar / LineThe actual visual element. dataKey tells it which field to use as the value.CellApplied inside Bar to colour individual bars differently.

Your data array shape
Recharts expects an array of objects. Each object is one bar or data point. The keys in the object are what you reference in dataKey:
jsconst data = [
  { name: 'Atraxa', winRate: 67, wins: 4, total: 6 },
  { name: 'Krenko', winRate: 33, wins: 1, total: 3 },
  { name: 'Muldrotha', winRate: 50, wins: 2, total: 4 },
]

// in the chart:
<XAxis dataKey="name" />      // uses the 'name' field for labels
<Bar dataKey="winRate" />     // uses the 'winRate' field for bar height

Bar chart — vertical bars (default)
jsx<BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
  <CartesianGrid strokeDasharray="3 3" vertical={false} />
  <XAxis dataKey="placement" tick={{ fontSize: 12 }} />
  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
  <Tooltip formatter={(value) => [value, 'Times']} />
  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
    {data.map((entry, index) => (
      <Cell key={index} fill={entry.raw === 1 ? '#639922' : '#888780'} />
    ))}
  </Bar>
</BarChart>
radius={[4, 4, 0, 0]} — rounds the top two corners of each bar (top-left, top-right, bottom-right, bottom-left).
vertical={false} on CartesianGrid — only shows horizontal grid lines.
allowDecimals={false} on YAxis — forces whole numbers on the axis.
Bar chart — horizontal bars (layout="vertical")
Swap the axis types and add layout="vertical":
jsx<BarChart data={data} layout="vertical" margin={{ left: 16, right: 32 }}>
  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
  <YAxis type="category" dataKey="name" width={120} />
  <Bar dataKey="winRate" radius={[0, 4, 4, 0]} />
</BarChart>
type="number" on XAxis and type="category" on YAxis — the types swap when you go horizontal.
domain={[0, 100]} — forces the axis to always show 0–100 (useful for percentages).
tickFormatter={(v) => \${v}%`}— formats axis labels, adding a % sign.width={120}` on YAxis — gives enough space for deck names.

Colouring bars individually with Cell
To give each bar its own colour based on its value, map over your data inside Bar and render a Cell for each entry:
jsx<Bar dataKey="winRate" radius={[0, 4, 4, 0]}>
  {data.map((entry, index) => (
    <Cell
      key={index}
      fill={entry.winRate >= 50 ? '#639922' : '#e24b4a'}
    />
  ))}
</Bar>
Each Cell corresponds to one bar. The fill is set per item based on its value — green for win rates above 50%, red for below.

Customising the Tooltip
The formatter prop controls what the tooltip displays on hover:
jsx<Tooltip
  formatter={(value, name, props) => [
    `${value}% (${props.payload.wins}/${props.payload.total})`,
    'Win rate'
  ]}
/>
formatter receives three arguments:

value — the raw data value (e.g. 67)
name — the dataKey name (e.g. "winRate")
props — the full data object for that bar, including all fields via props.payload

It returns an array of [displayValue, label].

Transforming data for charts
Raw API data rarely arrives in the shape Recharts needs. You almost always need to transform it first.
Building chart data from two arrays
The win rate chart needs data from both decks and matchPlayers. The pattern is to .map() over one array and look up related data from the other:
jsxconst data = decks
  .map((deck) => {
    // find all match records for this deck
    const deckMatches = matchPlayers.filter((mp) => mp.deck_id === deck.deckid)
    const wins = deckMatches.filter((mp) => mp.won === 1).length
    const total = deckMatches.length
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0

    return {
      name: deck.deckname,   // what Recharts uses for the label
      winRate,               // what Recharts uses for the bar height
      wins,                  // extra data available in the Tooltip
      total,
    }
  })
  .filter((d) => d.total > 0)        // remove decks with no matches
  .sort((a, b) => b.winRate - a.winRate)  // sort highest win rate first
Building placement counts from an array
Count how many times each placement value appears using an object as a counter:
jsconst counts = {}
matchPlayers.forEach((mp) => {
  counts[mp.placement] = (counts[mp.placement] || 0) + 1
})

// counts = { 1: 3, 2: 5, 3: 4, 4: 2 }
Then convert to a Recharts-friendly array:
jsconst data = Object.keys(counts)
  .map(Number)                           // convert string keys to numbers
  .sort((a, b) => a - b)                // sort numerically
  .map((placement) => ({
    placement: `#${placement}`,          // label shown on axis
    count: counts[placement],            // bar height
    raw: placement,                      // original number for colour logic
  }))
Object.keys() returns the keys of an object as an array of strings. .map(Number) converts each string to a number so the sort works correctly.

results.flat() — flattening an array of arrays
When Promise.all fetches match players for multiple decks, it returns an array of arrays — one per deck:
js[
  [mp1, mp2],    // deck 1's match players
  [mp3],         // deck 2's match players
  [mp4, mp5],    // deck 3's match players
]
.flat() merges them into a single array:
jsresults.flat()
// [mp1, mp2, mp3, mp4, mp5]
This is the standard pattern whenever you fetch a list of things for each item in another list:
jsPromise.all(
  decks.map((deck) =>
    fetch(`/matches_by_deck/${deck.deckid}`)
      .then((res) => res.status === 404 ? [] : res.json())
      .catch(() => [])
  )
).then((results) => {
  const allMatchPlayers = results.flat()
  setAllMatchPlayers(allMatchPlayers)
})

Deriving summary stats for metric cards
Compute top-level numbers from your existing state — no extra API calls or state needed:
jsconst totalWins    = allMatchPlayers.filter((mp) => mp.won === 1).length
const totalMatches = allMatchPlayers.length
const overallWinRate = totalMatches > 0
  ? Math.round((totalWins / totalMatches) * 100)
  : 0
Always guard against dividing by zero with a ternary. If totalMatches is 0, show — instead of NaN%:
jsx{totalMatches > 0 ? `${overallWinRate}%` : '—'}

Placement colour convention
A consistent colour scheme for placements makes charts immediately readable:
jsconst PLACEMENT_COLORS = {
  1: '#639922',   // green  — first place
  2: '#5dcaa5',   // teal   — second place
  3: '#ef9f27',   // amber  — third place
}

// in Cell:
fill={PLACEMENT_COLORS[entry.raw] || '#888780'}  // gray fallback for 4th+
Defining colours as a named object instead of inline ternaries keeps the logic clean and easy to update.

Quick reference
ResponsiveContainer     wrap every chart, makes it fill its parent width
BarChart layout="vertical"  horizontal bars — swap XAxis/YAxis types too
Cell                    colour individual bars based on their value
Tooltip formatter       customise the hover popup content
.flat()                 merge array of arrays into one flat array
Object.keys(obj)        get all keys of an object as a string array
.map(Number)            convert an array of strings to numbers
guard division by zero  totalMatches > 0 ? rate : '—'
PLACEMENT_COLORS        named colour object for consistent placement colouring


# React Router

---

## What React Router does

React Router lets you have real URLs for each page in a React app. Without it, React renders everything in one page and the URL never changes. With it, the browser bar updates, the back button works, and pages can be bookmarked and shared.

Install it:

```bash
npm install react-router-dom
```

---

## Core concepts

| Concept | What it does |
|---------|-------------|
| `BrowserRouter` | Wraps your whole app once. Enables routing everywhere inside it. |
| `Routes` | A container that looks at the current URL and renders the matching `Route`. |
| `Route` | Maps a URL path to a component. |
| `Link` | React Router's version of `<a>`. Navigates without a full page reload. |
| `useNavigate` | A hook that lets you navigate programmatically from inside a component. |
| `useParams` | A hook that reads dynamic segments from the URL. |
| `useLocation` | A hook that tells you the current URL path. |

---

## Setup

### 1. Wrap your app in BrowserRouter — `main.jsx`

Do this once, at the very top level:

```jsx
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
```

Everything inside `BrowserRouter` can use routing hooks and components.

### 2. Define your routes — `App.jsx`

```jsx
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Players from './pages/Players'
import PlayerDetail from './pages/PlayerDetail'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/players"     element={<Players />} />
        <Route path="/players/:id" element={<PlayerDetail />} />
      </Routes>
    </div>
  )
}
```

`Navbar` sits outside `Routes` so it always renders regardless of the current page.
`Routes` renders only the first `Route` whose path matches the current URL.

---

## URL parameters — useParams

A `:segment` in a path is a URL parameter — a dynamic value that changes per page:

```jsx
<Route path="/players/:id" element={<PlayerDetail />} />
```

`/players/1` → id is `"1"`
`/players/42` → id is `"42"`

Read it inside the component with `useParams`:

```jsx
import { useParams } from 'react-router-dom'

function PlayerDetail() {
  const { id } = useParams()
  // id is always a string — convert it when needed
  const numericId = parseInt(id)
}
```

**Important:** URL parameters are always strings, even if the value looks like a number. Always use `parseInt(id)` when your API or function expects a number.

---

## Navigating between pages

### Link — declarative navigation (use in JSX)

```jsx
import { Link } from 'react-router-dom'

<Link to="/players">Players</Link>
<Link to={`/players/${player.userid}`}>View player</Link>
```

`Link` renders as an `<a>` tag but intercepts the click and uses React Router instead of doing a full page reload. Always prefer `Link` over `<a href>` inside a React Router app.

### useNavigate — programmatic navigation (use in functions)

```jsx
import { useNavigate } from 'react-router-dom'

function Players() {
  const navigate = useNavigate()

  return (
    <button onClick={() => navigate(`/players/${player.userid}`)}>
      View player
    </button>
  )
}
```

Use `navigate` when you need to redirect after an action — clicking a card, submitting a form, or redirecting when data is not found:

```jsx
// redirect if player not found
fetch(`/users/${id}`)
  .then((res) => {
    if (!res.ok) throw new Error('Not found')
    return res.json()
  })
  .catch(() => navigate('/players'))  // send user back to the list
```

### Going back

```jsx
navigate(-1)        // go back one step in browser history
navigate('/players') // go to a specific page
```

---

## useLocation — reading the current URL

`useLocation` gives you the current location object. The most useful property is `pathname`:

```jsx
import { useLocation } from 'react-router-dom'

function Navbar() {
  const location = useLocation()

  return (
    <nav>
      <Link
        to="/players"
        className={location.pathname === '/players' ? 'font-medium' : 'text-gray-400'}
      >
        Players
      </Link>
    </nav>
  )
}
```

Use it to highlight the active nav link by comparing `location.pathname` to each link's path.

---

## Page structure with a shared Navbar

The Navbar sits outside `Routes` in `App.jsx` so it renders on every page:

```jsx
function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />        {/* always visible */}
      <Routes>          {/* only the matching page renders */}
        <Route path="/"        element={<Home />} />
        <Route path="/players" element={<Players />} />
      </Routes>
    </div>
  )
}
```

---

## How useEffect reacts to URL changes

When a user navigates to `/players/2` from `/players/1`, the `PlayerDetail` component stays mounted — only the URL changes. `useParams` gives you the new `id`, and `useEffect` with `[id]` in the dependency array re-fetches automatically:

```jsx
const { id } = useParams()

useEffect(() => {
  // re-runs every time id changes
  fetch(`/users/${id}`)
    .then((res) => res.json())
    .then((data) => setPlayer(data))
}, [id])
```

Without `id` in the dependency array, navigating from one player to another would show stale data.

---

## Recommended folder structure

```
src/
├── pages/
│   ├── Home.jsx          → route "/"
│   ├── Players.jsx       → route "/players"
│   └── PlayerDetail.jsx  → route "/players/:id"
├── components/
│   ├── Navbar.jsx        → shared across all pages
│   └── ...
└── App.jsx               → defines all routes
```

Pages are components that represent a full screen. Components are reusable pieces used inside pages. This separation keeps your code organised as the app grows.

---

## Link vs useNavigate — when to use which

| Situation | Use |
|-----------|-----|
| Navigation triggered by clicking text or a styled element | `Link` |
| Navigation triggered by clicking a button or card | `useNavigate` |
| Redirecting after a form submission | `useNavigate` |
| Redirecting when data is not found | `useNavigate` |
| Highlighting the active page in a navbar | `useLocation` |

---

## Common mistakes

### Using `<a href>` instead of `<Link>`

```jsx
// ❌ causes a full page reload, loses all React state
<a href="/players">Players</a>

// ✅ stays within React, no reload
<Link to="/players">Players</Link>
```

### Forgetting parseInt on URL params

```jsx
// ❌ passes a string "3" when the API expects a number
<AddDeckForm playerId={id} />

// ✅ converts to number first
<AddDeckForm playerId={parseInt(id)} />
```

### Missing id in useEffect dependency array

```jsx
// ❌ only fetches on first load — navigating to a different player shows stale data
useEffect(() => {
  fetch(`/users/${id}`)
}, [])

// ✅ re-fetches whenever the id in the URL changes
useEffect(() => {
  fetch(`/users/${id}`)
}, [id])
```

---

## Quick reference

```
BrowserRouter         wrap app once in main.jsx
Routes + Route        define URL → component mappings
<Route path="/x/:id"> :id is a dynamic URL parameter
useParams()           read URL parameters → always strings
useNavigate()         navigate programmatically from a function
navigate('/path')     go to a page
navigate(-1)          go back
<Link to="/path">     navigate from JSX without page reload
useLocation()         read current URL path
location.pathname     the current path e.g. "/players"
parseInt(id)          always convert URL params to numbers when needed
```

# Dynamic detail pages in React Router

## What a dynamic detail page is

A dynamic detail page is a page that renders differently based on a value in the URL. Instead of creating a separate page for every deck, player, or match, you create one component and let the URL tell it which item to show.

```
/decks/1    → shows Atraxa deck
/decks/2    → shows Krenko deck
/decks/42   → shows whatever deck has ID 42
```

One component. Infinite pages.

---

## The three building blocks

| Building block | What it does |
|---------------|-------------|
| `:id` in the route path | Marks a dynamic segment in the URL |
| `useParams()` | Reads the dynamic segment inside the component |
| `useNavigate()` | Navigates programmatically — including going back |

---

## Step 1 — define the route with a dynamic segment

In `App.jsx`, add `:id` to the path. The colon marks it as dynamic:

```jsx
import DeckDetail from './pages/DeckDetail'

<Route path="/decks/:id" element={<DeckDetail />} />
```

You can name it anything — `:id`, `:deckId`, `:slug`. The name you choose here is what you read with `useParams()`.

```jsx
// named :deckId
<Route path="/decks/:deckId" element={<DeckDetail />} />

// read as deckId
const { deckId } = useParams()
```

---

## Step 2 — read the ID inside the component

```jsx
import { useParams } from 'react-router-dom'

function DeckDetail() {
  const { id } = useParams()
  // id is "3" when the URL is /decks/3
  // id is always a STRING — convert to number when needed
}
```

---

## Step 3 — fetch data using the ID

Use the ID in a `useEffect` with `[id]` in the dependency array. This means the effect re-runs whenever the URL changes — so navigating from `/decks/1` to `/decks/2` automatically fetches new data:

```jsx
const [item, setItem] = useState(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetch(`http://localhost:8000/your-endpoint/${id}`)
    .then((res) => {
      if (!res.ok) throw new Error('Not found')
      return res.json()
    })
    .then((data) => {
      setItem(data)
      setLoading(false)
    })
    .catch(() => navigate('/your-list-page'))  // redirect if not found
}, [id])   // ← re-runs when id changes
```

Always redirect on error — never leave the user on a broken page.

---

## Step 4 — navigate to the detail page

### From a list component — using useNavigate

```jsx
import { useNavigate } from 'react-router-dom'

function DeckCard({ deck }) {
  const navigate = useNavigate()

  return (
    <div onClick={() => navigate(`/decks/${deck.deckid}`)}>
      {deck.deckname}
    </div>
  )
}
```

### From a nav link — using Link

```jsx
import { Link } from 'react-router-dom'

<Link to={`/decks/${deck.deckid}`}>
  {deck.deckname}
</Link>
```

Use `navigate` when the click triggers something else too (a button, a card). Use `Link` for plain text or nav items.

---

## Step 5 — add a back button

```jsx
const navigate = useNavigate()

<button onClick={() => navigate(-1)}>
  ← Back
</button>
```

`navigate(-1)` goes back one step in browser history — back to wherever the user came from. Better than hardcoding a path because it works regardless of how the user arrived.

```js
navigate('/decks')   // always goes to /decks — ignores where user came from
navigate(-1)         // goes back to the previous page in history
```

---

## The general template

Every dynamic detail page follows this exact structure. Copy and adapt it for any entity:

```jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const API_BASE = 'http://localhost:8000'

function ThingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  // 1. state for the main item
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)

  // 2. state for related data (optional)
  const [relatedItems, setRelatedItems] = useState([])

  // 3. fetch the main item
  useEffect(() => {
    fetch(`${API_BASE}/things/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then((data) => {
        setItem(data)
        setLoading(false)
      })
      .catch(() => navigate('/things'))  // redirect if not found
  }, [id])

  // 4. fetch related data (optional, separate useEffect)
  useEffect(() => {
    fetch(`${API_BASE}/related-things/${id}`)
      .then((res) => res.status === 404 ? [] : res.json())
      .then((data) => setRelatedItems(data))
      .catch(() => setRelatedItems([]))
  }, [id])

  // 5. derive stats from related data
  const total = relatedItems.length
  const someCount = relatedItems.filter((r) => r.someField === true).length

  // 6. handle loading and missing item
  if (loading) return <p className="p-8 text-sm text-gray-400">Loading...</p>
  if (!item) return null

  // 7. render
  return (
    <div className="max-w-3xl mx-auto p-8">

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <h1 className="text-2xl font-medium text-gray-900 mb-6">
        {item.name}
      </h1>

      {/* stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total</p>
          <p className="text-2xl font-medium text-gray-900">{total}</p>
        </div>
      </div>

      {/* related items */}
      <div className="flex flex-col gap-3">
        {relatedItems.map((r) => (
          <div key={r.id}>{r.name}</div>
        ))}
      </div>

    </div>
  )
}

export default ThingDetail
```

---

## Derived stats — compute from state, not extra fetches

Stats like win rate, average placement, and counts should be computed directly from existing state. No extra API calls needed:

```jsx
const totalMatches = matchPlayers.length
const wins         = matchPlayers.filter((mp) => mp.won === 1).length
const losses       = totalMatches - wins
const winRate      = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0

const avgPlacement = totalMatches > 0
  ? (matchPlayers.reduce((sum, mp) => sum + mp.placement, 0) / totalMatches).toFixed(1)
  : '—'
```

These recalculate automatically whenever `matchPlayers` changes. No `useState` needed for derived values.

`.reduce()` is used here for the average — it accumulates a running total across the array:

```js
// sum all placements then divide by count
matchPlayers.reduce((sum, mp) => sum + mp.placement, 0)
//           ↑ accumulator  ↑ current item  ↑ starting value
```

---

## Connecting the list page to the detail page

The list page just navigates to the detail page — it does not need to pass any data. The detail page fetches its own data from the URL.

```
List page          Detail page
/decks    →  click  →  /decks/3
              id=3
              fetches /decks/3 from API
              renders DeckDetail with that data
```

This means:
- The list page stays simple — it only needs to know IDs
- The detail page is self-contained — it can be linked to directly
- Refreshing the detail page works — the URL has everything needed to refetch

---

## The URL parameter gotcha

URL parameters are always strings. Always convert to a number when your API or a function expects one:

```jsx
const { id } = useParams()

// ❌ passes string "3" — may cause API issues
fetch(`/decks/${id}`)              // fine for URLs
someFunction(id)                   // wrong if function expects number

// ✅ convert when needed
someFunction(parseInt(id))
<AddDeckForm playerId={parseInt(id)} />
```

---

## Multiple dynamic segments

You can have more than one dynamic segment in a path:

```jsx
<Route path="/players/:playerId/decks/:deckId" element={<PlayerDeckDetail />} />

// inside the component
const { playerId, deckId } = useParams()
```

---

## Quick reference

```
Define route:        <Route path="/things/:id" element={<ThingDetail />} />
Read URL param:      const { id } = useParams()
Always a string:     parseInt(id) when number needed
Fetch on load:       useEffect(() => { fetch(...id) }, [id])
Redirect if 404:     .catch(() => navigate('/things'))
Go back:             navigate(-1)
Go to detail:        navigate(`/things/${item.id}`)
Link to detail:      <Link to={`/things/${item.id}`}>text</Link>
Derive stats:        compute from state — no extra useState or fetch needed
```
# Dynamic forms and sequential fetches

---

## What a dynamic form is

A dynamic form has a variable number of rows — the user can add or remove entries before submitting. Instead of a fixed set of inputs, you store the rows as an array in state and render them with `.map()`.

```
Date:     [ 2024-01-15 ]
Comment:  [ Won via combo ]

Participants:
  #1  [ Atraxa ▾ ]  [1]  [🗑]
  #2  [ Krenko ▾ ]  [2]  [🗑]
  #3  [ Muldrotha▾]  [3]  [🗑]
  + Add participant

[ Log match ]
```

---

## Storing rows as an array in state

Each row is an object. The whole form's row data is one array in state:

```jsx
const [participants, setParticipants] = useState([
  { deckId: '', placement: 1 },
  { deckId: '', placement: 2 },
])
```

Rendering the rows is just `.map()` over the array:

```jsx
{participants.map((p, index) => (
  <div key={index}>
    <select value={p.deckId} onChange={(e) => updateParticipant(index, 'deckId', e.target.value)}>
      ...
    </select>
    <input value={p.placement} onChange={(e) => updateParticipant(index, 'placement', parseInt(e.target.value))} />
  </div>
))}
```

---

## Adding a row

Spread the existing array and append a new object:

```jsx
function addParticipant() {
  setParticipants([
    ...participants,
    { deckId: '', placement: participants.length + 1 }
  ])
}
```

---

## Removing a row

Filter out the row at the given index, then renumber the placements so they stay sequential:

```jsx
function removeParticipant(index) {
  const updated = participants
    .filter((_, i) => i !== index)       // remove the row
    .map((p, i) => ({ ...p, placement: i + 1 }))  // renumber 1, 2, 3...
  setParticipants(updated)
}
```

The `_` is a convention meaning "I don't need this argument". Here the first argument is the participant value — we only care about the index `i`.

---

## Updating one field of one object in an array

Use `.map()` to find the right row and the computed property name `[field]` to update whichever field was changed:

```jsx
function updateParticipant(index, field, value) {
  setParticipants(participants.map((p, i) =>
    i === index ? { ...p, [field]: value } : p
  ))
}
```

`[field]` uses the value of the `field` variable as the object key:

```js
field = 'deckId'    → { ...p, deckId: value }
field = 'placement' → { ...p, placement: value }
```

This one function handles all fields — you don't need a separate updater for each input.

---

## Validation before submitting

Always validate the whole form before firing any requests:

```jsx
function validate() {
  if (!date) return 'Date is required'
  if (participants.length < 2) return 'A match needs at least 2 participants'

  for (const p of participants) {
    if (!p.deckId) return 'All participants need a deck selected'
  }

  // check for duplicate decks
  const deckIds = participants.map((p) => p.deckId)
  const unique = new Set(deckIds)
  if (unique.size !== deckIds.length) return 'Each deck can only appear once'

  return null  // null means no error
}

function handleSubmit() {
  const validationError = validate()
  if (validationError) {
    setError(validationError)
    return   // stop here — no fetch
  }
  // proceed with fetch
}
```

Returning `null` from `validate()` is the convention for "everything is fine". The `for...of` loop is a clean way to check every item in an array and return early on the first problem.

---

## Sequential then parallel fetch

Some operations require a specific order. Creating a match and its players requires:

1. Create the match first to get its `match_id`
2. Use that `match_id` to create all the match players

You cannot do step 2 without the result of step 1.

```jsx
// step 1 — create the match
fetch(`/matches/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ date, comment, group_id: 1 })
})
  .then((res) => res.json())
  .then((newMatch) => {

    // step 2 — create all match players in parallel
    return Promise.all(
      participants.map((p) =>
        fetch(`/matchplayers/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            match_id: newMatch.match_id,   // use the ID from step 1
            deck_id: parseInt(p.deckId),
            placement: p.placement,
            won: p.placement === 1 ? 1 : 0,
          })
        }).then((res) => res.json())
      )
    ).then(() => newMatch)  // pass newMatch through to the next .then()
  })
  .then((newMatch) => {
    // step 3 — all done, update the UI
    onMatchAdded(newMatch.match_id)
  })
  .catch((err) => {
    setError(err.message)
    setSubmitting(false)
  })
```

### The flow visualised

```
POST /matches/
      ↓
   match_id received
      ↓
Promise.all([
  POST /matchplayers/  deck 1  ─┐
  POST /matchplayers/  deck 2  ─┤ all fire at the same time
  POST /matchplayers/  deck 3  ─┘
])
      ↓
   all three done
      ↓
update UI
```

Sequential where order matters, parallel where it doesn't. This is the fastest possible approach.

---

## Passing data through a .then() chain

When you need data from an earlier `.then()` in a later one, return it through the chain:

```jsx
.then((newMatch) => {
  return Promise.all([...]).then(() => newMatch)  // ← pass newMatch through
})
.then((newMatch) => {
  // newMatch is available here because we returned it above
  console.log(newMatch.match_id)
})
```

Without the `then(() => newMatch)` at the end, the next `.then()` would receive the `Promise.all` result instead of `newMatch`.

---

## Re-fetching vs appending after submit

Two strategies for updating the list after a successful submit:

### Append — fast, no extra request

```jsx
.then((newMatch) => {
  setMatches([...matches, newMatch])
})
```

Use when: the new item has all the data you need right away.

### Re-fetch — slower, always accurate

```jsx
function loadMatches() {
  fetch('/matches/')
    .then(...)
    .then((data) => setMatches(data))
}

.then(() => {
  loadMatches()  // re-fetch the full list
})
```

Use when: the new item needs enrichment from other endpoints (e.g. a match needs player and deck names from `/matches/detail`). Appending a raw match object would show an incomplete card, so re-fetching the enriched version is cleaner.

---

## The toggle pattern for showing a form

Show and hide the form with a boolean state and a single button that changes label:

```jsx
const [showForm, setShowForm] = useState(false)

<button onClick={() => setShowForm(!showForm)}>
  {showForm ? 'Cancel' : 'Log match'}
</button>

{showForm && <AddMatchForm onMatchAdded={handleMatchAdded} />}
```

When the form submits successfully, hide it:

```jsx
function handleMatchAdded() {
  setShowForm(false)
  loadMatches()
}
```

---

## Extracting a load function

When you need to call the same fetch from both `useEffect` and after a form submit, extract it into a named function:

```jsx
function loadMatches() {
  setLoading(true)
  fetch('/matches/')
    .then(...)
    .then((data) => {
      setMatches(data)
      setLoading(false)
    })
}

// call on first load
useEffect(() => {
  loadMatches()
}, [])

// call again after adding a match
function handleMatchAdded() {
  setShowForm(false)
  loadMatches()   // same function, reused
}
```

This avoids duplicating the fetch logic and keeps everything in sync.

---

## Quick reference

```
Dynamic rows:          useState([{ field: '', ... }])
Add a row:             setItems([...items, newItem])
Remove a row:          items.filter((_, i) => i !== index)
Renumber after remove: .map((p, i) => ({ ...p, placement: i + 1 }))
Update one field:      items.map((p, i) => i === index ? { ...p, [field]: value } : p)
[field] syntax:        computed property name — uses variable value as key
Validate first:        return error string or null, check before fetching
Sequential fetch:      step 2 inside step 1's .then()
Pass data through:     .then(() => newMatch) to keep data available downstream
Re-fetch vs append:    append when data is complete, re-fetch when enrichment needed
Toggle form:           useState(false) + !showForm + {showForm && <Form />}
Extract load fn:       named function called by both useEffect and onSubmit handler
```