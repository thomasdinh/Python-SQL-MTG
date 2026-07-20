# Database Schema

The MTG Commander Tracker uses a MySQL database with four tables. The schema
is built around the concept of a **match**: players bring decks, play a
game, and one placement is recorded per deck per match.

> This document was rewritten to match the schema actually defined in
> `backend/database.py` — an earlier version of this file described a
> `Matches`/`played_at` schema that was never implemented, and mislabeled
> the table that's actually in use (`MTGMatches`) as legacy. If you're
> looking at `docs/images/database-schema.png` and it doesn't match what's
> below, trust this file and treat the image as stale until it's
> regenerated.

---

## Overview

```
Users ──< Decks ──< MatchPlayers >── MTGMatches
```

- A **User** owns one or more **Decks**
- A **MTGMatch** has multiple **MatchPlayer** entries (one per deck/player in that game)
- **MatchPlayers** is the join table linking a deck to a match, with placement and win result

---

## Tables

### `Users`

Stores the players in the group.

| Column      | Type          | Constraints         | Description                        |
|-------------|---------------|----------------------|-------------------------------------|
| `userid`    | INT           | PK, AUTO_INCREMENT  | Unique identifier for the player   |
| `firstname` | VARCHAR(32)   | NOT NULL             | Player's first name                |
| `lastname`  | VARCHAR(32)   | NOT NULL             | Player's last name                 |

---

### `Decks`

Stores each Commander deck owned by a player.

| Column        | Type          | Constraints                                    | Description                                              |
|---------------|---------------|-------------------------------------------------|------------------------------------------------------------|
| `deckid`      | INT           | PK, AUTO_INCREMENT                              | Unique identifier for the deck                           |
| `deckname`    | VARCHAR(32)   | NOT NULL                                        | Display name of the deck (usually the commander's name)  |
| `partnername` | VARCHAR(32)   | nullable                                        | Name of the partner commander (if applicable)             |
| `color`       | VARCHAR(16)   | nullable                                        | Color identity, single-letter codes (see below)           |
| `manavalue`   | INT           | nullable                                        | Mana value (converted mana cost) of the commander         |
| `image_url`   | VARCHAR(255)  | nullable                                        | URL to the commander's card image                         |
| `ownerid`     | INT           | FK → `Users.userid`, `ON DELETE RESTRICT`      | The player who owns this deck                             |

**Notes:**
- Color identity uses single-letter codes: `W` (White), `U` (Blue), `B` (Black), `R` (Red), `G` (Green) — e.g. a 5-color deck is `WUBRG`. There's no `commander` column separate from `deckname`; `deckname` doubles as the commander's display name.
- `ownerid`'s foreign key is optional (see [Migrations](#migrations) below) — it isn't enforced on databases created before that migration was run.
- Indexed on `ownerid` (`idx_decks_ownerid`) since `/decks_by_player/{id}` and `/decks/with-stats?ownerid=` both filter on it.

---

### `MTGMatches`

Stores each individual Commander game session. Despite the name (a holdover
from before `MatchPlayers` existed as a separate join table), this is the
**active** matches table — there is no other one.

| Column         | Type          | Constraints         | Description                                                        |
|----------------|---------------|----------------------|----------------------------------------------------------------------|
| `match_id`     | INT           | PK, AUTO_INCREMENT  | Unique identifier for the match                                    |
| `Decklist`     | VARCHAR(256)  | NOT NULL             | Legacy field, kept for schema compatibility — not used by the app's actual match logic, which reads participants from `MatchPlayers` instead |
| `match_result` | VARCHAR(128)  | nullable             | Legacy field, same as above — the frontend always sends `'completed'` |
| `date`         | VARCHAR(10)   | NOT NULL             | Date the match was played, `YYYY-MM-DD` string (not a real `DATE` column) |
| `group_id`     | INT           | nullable             | Playgroup/pod identifier — an arbitrary integer, not a table of its own (see note below) |
| `comment`      | VARCHAR(256)  | nullable             | Optional notes about the match                                     |

**Notes:**
- `date` is a plain string column, not a SQL `DATE` type — sorts and range-filters correctly *only* because the app always writes `YYYY-MM-DD`. Don't insert dates in any other format.
- `group_id` has no `Playgroups` table backing it — it's just an integer you assign consistently to mean "these matches were the same pod." The API and frontend tier list / filters treat distinct `group_id` values as distinct playgroups, labeled generically ("Group 1", "Group 2", …). If you want real group names, that'd mean adding a `Playgroups` table and a proper foreign key here — not done yet.
- Indexed on `date` (`idx_mtgmatches_date`) and `group_id` (`idx_mtgmatches_group_id`) — added in migration 002 to support the tier list and match filters' date-range and playgroup filtering, and the `MAX(date)` "last played" aggregate in `/decks/with-stats`.

---

### `MatchPlayers`

Join table linking decks to matches. Each row represents one deck's participation in one match.

| Column      | Type    | Constraints                                                   | Description                                              |
|-------------|---------|-----------------------------------------------------------------|--------------------------------------------------------------|
| `id`        | INT     | PK, AUTO_INCREMENT                                              | Unique identifier for this entry                          |
| `match_id`  | INT     | FK → `MTGMatches.match_id`, `ON DELETE CASCADE`                | The match this entry belongs to                            |
| `deck_id`   | INT     | FK → `Decks.deckid`, `ON DELETE RESTRICT`                      | The deck that participated                                 |
| `placement` | INT     | NOT NULL                                                         | Final placement in the match (1 = winner, 2 = second, …)  |
| `won`       | INT     | NOT NULL                                                         | Whether this deck won (`1`) or not (`0`)                  |

**Notes:**
- `placement` and `won` are independent columns and can, in principle, disagree — the app always writes them consistently (placement `1` → `won = 1`), but nothing at the DB level enforces that.
- Deleting a match cascades to delete its `MatchPlayers` rows (`ON DELETE CASCADE`) — this matches what `DELETE /matches/{id}` already assumed before the FK existed. Deleting a deck that still has match history is blocked (`ON DELETE RESTRICT`) rather than silently deleted.
- Indexed on `match_id` (`idx_matchplayers_match_id`) and on the composite `(deck_id, won)` (`idx_matchplayers_deck_won`) — the composite lets MySQL answer the `COUNT(*)`/`SUM(won)` aggregate behind `/decks/with-stats` from the index alone, without reading full rows.

---

## Migrations

The schema above reflects `backend/database.py`'s ORM models, which is what
`Base.metadata.create_all()` will produce on a **brand-new** database. If
your database already existed before these changes, `create_all()` won't
retroactively add the new indexes or constraints to existing tables — run
the migrations in `backend/migrations/` directly:

| File                             | What it adds                                                              | Required? |
|-----------------------------------|-----------------------------------------------------------------------------|-----------|
| `001_add_indexes.sql`             | Indexes on `MatchPlayers.deck_id`, `MatchPlayers.match_id`, `Decks.ownerid` | Yes — the API assumed these from the start |
| `002_add_query_indexes.sql`       | Indexes on `MTGMatches.date`, `MTGMatches.group_id`, composite `MatchPlayers(deck_id, won)` | Recommended — speeds up the tier list, filters, and win-rate aggregate |
| `003_add_foreign_keys.sql`        | Real FK constraints (see tables above)                                     | Optional — run the orphan-check queries in the file first; it'll fail if any orphaned rows exist |

```bash
mysql -u <user> -p <database> < backend/migrations/001_add_indexes.sql
mysql -u <user> -p <database> < backend/migrations/002_add_query_indexes.sql
mysql -u <user> -p <database> < backend/migrations/003_add_foreign_keys.sql   # optional, read the file first
```

---

## Common Queries

**Get all matches played by a specific player:**
```sql
SELECT DISTINCT mp.match_id, m.date, d.deckname, mp.placement, mp.won
FROM MatchPlayers mp
JOIN Decks d ON mp.deck_id = d.deckid
JOIN MTGMatches m ON mp.match_id = m.match_id
WHERE d.ownerid = 1
ORDER BY m.date DESC;
```

**Get win rate per deck** (this is what `/decks/with-stats` runs, minus the `ownerid` filter):
```sql
SELECT d.deckname, COUNT(mp.id) AS total_matches, SUM(mp.won) AS wins,
       ROUND(SUM(mp.won) / COUNT(mp.id) * 100, 1) AS win_rate_pct,
       MAX(m.date) AS last_played
FROM Decks d
LEFT JOIN MatchPlayers mp ON mp.deck_id = d.deckid
LEFT JOIN MTGMatches m ON m.match_id = mp.match_id
GROUP BY d.deckid, d.deckname
ORDER BY win_rate_pct DESC;
```

**Get full detail for a match** (what `/matches/{id}/detail` runs):
```sql
SELECT m.match_id, m.date, m.comment,
       d.deckname, u.firstname, u.lastname, mp.placement, mp.won
FROM MTGMatches m
JOIN MatchPlayers mp ON m.match_id = mp.match_id
JOIN Decks d ON mp.deck_id = d.deckid
JOIN Users u ON d.ownerid = u.userid
WHERE m.match_id = 1
ORDER BY mp.placement;
```

**Matches within a date range for one playgroup** (what the tier list and
match filters compute client-side from `/matches/detail` — shown here as
the SQL equivalent in case you ever need it server-side):
```sql
SELECT m.match_id, m.date, m.group_id, d.deckname, mp.won
FROM MTGMatches m
JOIN MatchPlayers mp ON m.match_id = mp.match_id
JOIN Decks d ON mp.deck_id = d.deckid
WHERE m.date BETWEEN '2026-01-01' AND '2026-06-30'
  AND m.group_id = 1
ORDER BY m.date;
```

---

## Entity Relationship Summary

```
Users
  userid (PK)
  firstname, lastname
    │
    │ 1:N (owns)      ownerid FK, ON DELETE RESTRICT
    ▼
Decks
  deckid (PK)
  deckname, partnername
  color, manavalue, image_url
  ownerid (FK → Users)
    │
    │ 1:N (played in)  deck_id FK, ON DELETE RESTRICT
    ▼
MatchPlayers ◄──── MTGMatches
  id (PK)              match_id (PK)
  match_id (FK,         Decklist, match_result (legacy, unused)
    ON DELETE CASCADE)  date (string, YYYY-MM-DD)
  deck_id (FK)          group_id (playgroup, no lookup table)
  placement              comment
  won
```
