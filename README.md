#  MTG Commander Tracker

A full-stack web application for tracking **Magic: The Gathering Commander** match results, statistics, and player performance.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Performance notes](#performance-notes)
- [Contributing](#contributing)

---

## Overview

MTG Commander Tracker lets you log Commander (EDH) matches, track win rates per commander, analyze player performance over time, and browse match history — all through a clean React interface backed by a FastAPI + MySQL server.

---

## Tech Stack

| Layer     | Technology                                              |
|-----------|-----------------------------------------------------------|
| Frontend  | React, React Router, TanStack Query, Tailwind CSS v4, Recharts |
| Backend   | FastAPI (Python), SQLAlchemy                              |
| Database  | MySQL                                                      |
| API Docs  | Swagger UI / ReDoc                                         |

---

## Features

- 📝 Log Commander match results (players, commanders, winner, date)
- 📊 View win rates and stats per commander, with a win-rate progression chart per deck/player (cumulative or rolling window, filterable by date range, playgroup, and opponent)
- 🏅 Tier list — decks bucketed into SSS–F tiers by win rate or usage, adjustable by timespan and playgroup
- 🏆 Player leaderboard, sortable by win rate, matches played, or name
- 🤝 Head-to-head records — how a player does specifically in games where a given pod-mate was also at the table
- 🔥 Win/loss streaks (current and longest) per deck and per player
- 🔍 Filter and sort decks (by player, color identity, win rate, recency) and matches (by date range, player count, commander, player, playgroup)
- 📤 CSV export of match history (complementing the existing CSV import), respecting whatever filters are currently active
- ⚡ Client-side caching (TanStack Query) so revisiting a page doesn't re-fetch or re-block on a loading spinner
- ⚙️ Settings page to point the app at a different backend at runtime (e.g. localhost during development) — no rebuild needed, persisted in the browser
- 🎨 Light/dark/system theme, plus a custom accent color — applied live, no reload, persisted in the browser
- 🌐 Language switcher (English/Deutsch/Español) — applied live, no reload
- ⚡ Auto-generated interactive API docs

---

## Project Structure

```
python-sql-mtg/
├── backend/
│   ├── FastApi.py                  # FastAPI app entry point
│   ├── database.py                 # MySQL connection, session, ORM models
│   ├── schemas.py                  # Pydantic schemas
│   ├── migrations/                 # SQL migrations — run these against an existing DB
│   │   ├── 001_add_indexes.sql
│   │   ├── 002_add_query_indexes.sql
│   │   └── 003_add_foreign_keys.sql
│   ├── login.env                   # create your own — see Environment Variables below
│   └── requirements.txt
├── frontend/mtg-dashboard/
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │    ├── ColorIdentity.jsx  #   deck color identity as mana pips
│   │   │    ├── DeckFilters.jsx, MatchFilters.jsx
│   │   │    ├── WinRateProgressionChart.jsx, WinRateChart.jsx, PlacementChart.jsx
│   │   │    ├── HeadToHead.jsx     #   rivalry record vs. each pod-mate
│   │   │    ├── DeckCard.jsx, MatchCard.jsx, StatCard.jsx
│   │   │    └── ...                # forms, Navbar, etc.
│   │   ├── pages/                  # Page-level views (one per route)
│   │   │    ├── Home.jsx, Players.jsx, PlayerDetail.jsx
│   │   │    ├── Decks.jsx, DeckDetail.jsx
│   │   │    ├── Matches.jsx, TierList.jsx, Settings.jsx
│   │   ├── hooks/                  # TanStack Query hooks — all data fetching goes through these
│   │   │    ├── useUsers.js, useDecks.js, useMatches.js
│   │   ├── utils/                  # Pure functions (filtering, sorting, tiering, stats) — unit-testable, no React
│   │   │    ├── deckFilters.js, matchFilters.js, deckTiers.js
│   │   │    ├── winRateProgression.js, playerStats.js, headToHead.js, streaks.js, csvExport.js
│   │   ├── i18n/
│   │   │    ├── translations.js    # en/de/es dictionaries
│   │   │    ├── context.js         # I18nContext + useTranslation() hook
│   │   │    └── I18nProvider.jsx
│   │   ├── theme.js                # theme mode (dark/light/system) + custom accent color
│   │   ├── queryClient.js          # shared TanStack Query cache config
│   │   ├── config.js                # API_BASE, overridable via VITE_API_BASE
│   │   └── App.jsx
│   └── package.json
├── docs/
│   └── database.md                 # schema reference
└── README.md
```


---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- MySQL 8.0+

---

### Backend Setup

```bash
# 1. Navigate to the backend folder
cd backend

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy and fill in environment variables
touch login.env

#5. Edit .env var if neccessary


# 6. Start the development server
uvicorn FastApi:app --reload
```

How the . env file should look like
```
DB_USER=YOUR_DB_USER
DB_PASSWORD=YOUR_DB_PASSWORD
DB_HOST=localhost               #change to webservice-url if you have a online server
DB_PORT=3306
DB_NAME=YOUR_DB_NAME
```


The API will be available at `http://localhost:8000`.
Interactive docs at `http://localhost:8000/docs`.

---

### Frontend Setup

```bash
# 1. Navigate to the frontend folder (note: mtg-dashboard, not just frontend/)
cd frontend/mtg-dashboard

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The React app will be available at `http://localhost:5173`.

By default it points at the deployed backend (`https://python-sql-mtg.onrender.com`). To point it at your local backend instead, either use the **Settings** page in the app itself (gear icon in the navbar — no rebuild needed, persists in your browser), or set it at build time via `frontend/mtg-dashboard/.env.local`:

```env
VITE_API_BASE=http://localhost:8000
```

The Settings page takes priority over `VITE_API_BASE` if both are set.

---

### Database Setup

```sql
CREATE DATABASE mtg_tracker;
```

For a **brand-new** database, let SQLAlchemy create the tables (this also
creates the indexes and foreign keys declared in `database.py`'s ORM models):

```bash
cd backend
python -c "from database import Base, engine; Base.metadata.create_all(engine)"
```

For an **existing** database, `create_all()` won't retroactively add
indexes or constraints to tables that already exist — run the migrations
in `backend/migrations/` directly instead. See
[`docs/database.md`](docs/database.md#migrations) for what each one adds
and whether it's required.

```bash
mysql -u <user> -p <database> < backend/migrations/001_add_indexes.sql
mysql -u <user> -p <database> < backend/migrations/002_add_query_indexes.sql
mysql -u <user> -p <database> < backend/migrations/003_add_foreign_keys.sql   # optional — read the file first
```

---

## Environment Variables

### Backend (`backend/login.env`)

Only these are actually read by `database.py` and `FastApi.py` — there's no
`APP_ENV` or `SECRET_KEY` in the code despite what older versions of this
README claimed.

```env
DB_USER=YOUR_DB_USER
DB_PASSWORD=YOUR_DB_PASSWORD
DB_HOST=localhost                # or your hosted DB's URL
DB_PORT=3306
DB_NAME=YOUR_DB_NAME

# Optional. Comma-separated list of allowed frontend origins for CORS.
# Defaults to "*" (any origin) if unset, so this is safe to leave out
# during local development — but set it once you know your frontend's
# deployed URL.
ALLOWED_ORIGINS=https://your-frontend.example.com,http://localhost:5173
```

### Frontend (`frontend/mtg-dashboard/.env.local`)

```env
# Optional. Overrides the deployed backend URL at build time. The in-app
# Settings page (gear icon in the navbar) overrides this at runtime if set —
# see localStorage key `mtg_api_base` in src/config.js.
VITE_API_BASE=http://localhost:8000
```

---

## API Reference

Once the backend is running, visit:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

> Default port is `8000`, configurable via the `PORT` environment variable.

---

### Users

| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | `/users/`             | List all users           |
| GET    | `/users/{user_id}`    | Get a user by ID         |
| POST   | `/users/`             | Create a new user        |
| PUT    | `/users/{user_id}`    | Update a user by ID      |
| DELETE | `/users/{user_id}`    | Delete a user by ID      |

---

### Matches

| Method | Endpoint                              | Description                                          |
|--------|-----------------------------------------|--------------------------------------------------------|
| GET    | `/matches/`                             | List all matches (bare fields, no player detail)      |
| GET    | `/matches/detail`                       | List **all** matches with players/decks/placements already joined in — one request instead of N |
| GET    | `/matches/{match_id}`                   | Get a match by ID                                    |
| GET    | `/matches/{match_id}/detail`            | Get full detail for one match (players, decks, placements) |
| POST   | `/matches/`                             | Create a new match                                   |
| PUT    | `/matches/{match_id}`                   | Update a match by ID                                 |
| DELETE | `/matches/{match_id}`                   | Delete a match by ID (also deletes its `MatchPlayers` rows) |
| GET    | `/matches_by_deck/{deck_id}`            | List raw `MatchPlayers` rows for a deck (no date/opponent info) |
| GET    | `/matches_by_deck/{deck_id}/detail`     | Same, but joined with each match's date/comment — one request instead of N |
| GET    | `/matches_by_player/{ownerid}`          | List every `MatchPlayers` row across all of a player's decks |

> `/matches/detail` and `/matches_by_deck/{deck_id}/detail` exist specifically to avoid the N+1 pattern of fetching a list then calling a detail endpoint once per item — see [Performance notes](#performance-notes) below.

---

### Decks

| Method | Endpoint                          | Description                        |
|--------|-----------------------------------|------------------------------------|
| GET    | `/decks/`                         | List all decks (bare fields, no stats) |
| GET    | `/decks/with-stats`                | List all decks with matches/wins/last-played already computed. Pass `?ownerid=<id>` to scope to one player's decks |
| GET    | `/decks/{deck_id}`                | Get a deck by ID                   |
| GET    | `/decks/name/{deckname}`          | Get a deck by name                 |
| GET    | `/decks_by_player/{ownerid}`      | List all decks owned by a player (bare fields — prefer `/decks/with-stats?ownerid=` if you need stats) |
| POST   | `/decks/`                         | Create a new deck                  |
| PUT    | `/decks/{deck_id}`                | Update a deck by ID                |
| DELETE | `/decks/{deck_id}`                | Delete a deck by ID (blocked if it still has match history — see [`docs/database.md`](docs/database.md)) |
| DELETE | `/decks/name/{deckname}`          | Delete a deck by name              |

---

### Match Players

| Method | Endpoint                    | Description                          |
|--------|-----------------------------|--------------------------------------|
| GET    | `/matchplayers/{mp_id}`     | Get a match-player entry by ID       |
| POST   | `/matchplayers/`            | Add a player entry to a match        |
| PUT    | `/matchplayers/{mp_id}`     | Update a match-player entry          |
| DELETE | `/matchplayers/{mp_id}`     | Remove a player entry from a match   |

---

## Performance notes

A few deliberate choices worth knowing about if you're extending this:

- **N+1 avoidance**: `/decks/with-stats`, `/matches/detail`, and `/matches_by_deck/{id}/detail` all exist so the frontend can render a page with one request instead of fetching a list, then calling a detail endpoint once per item. If you add a new list+detail page, follow that pattern rather than looping fetches client-side.
- **Indexes**: see [`docs/database.md`](docs/database.md#migrations) — three migrations add indexes on every column used in a `WHERE`/`JOIN`/`ORDER BY` in the codebase, plus a composite index that lets the win-rate aggregate be answered from the index alone. None of this matters at a few hundred rows; all of it matters once match history accumulates over a few seasons.
- **Response compression**: `GZipMiddleware` compresses any response over 500 bytes. Transparent — no frontend changes needed.
- **Connection pool**: `backend/database.py` keeps 5 connections open with room for 5 more under load (`pool_size=5, max_overflow=5`). This was bumped up from 2+2 because detail pages now fire several requests in parallel (e.g. the deck detail page loads the deck, its match history, the full match list, the full deck list, and the player list all at once, to populate its filter panels without extra round-trips later). If your MySQL host has a low `max_connections` limit (common on free tiers), check it before raising this further.
- **Client-side filtering, not server-side**: the deck/match filters, the tier list, and the win-rate progression charts all compute entirely in the browser from data already fetched (via TanStack Query, which caches it). This was a deliberate tradeoff for this app's realistic scale (a friend group's match history — dozens to low hundreds of games, not thousands): filtering client-side means changing a filter is instant with no network round-trip, at the cost of shipping the full match list to the browser once. If your dataset grows large enough that this stops being true, the natural next step is adding `from`/`to`/`group_id` query parameters to `/matches/detail` itself and moving the filtering server-side — the endpoint is already positioned to take those without a breaking change (no params = current behavior, return everything).

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

> Built with for improving and using skills acquired in university