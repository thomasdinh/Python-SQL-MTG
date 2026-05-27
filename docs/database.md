# Database Schema

The MTG Commander Tracker uses a MySQL database with four active tables. The schema is designed around the core concept of a **match**: players bring decks, play a game, and one placement is recorded per deck per match.

---

## Overview

```
Users ──< Decks ──< MatchPlayers >── Matches
```

- A **User** owns one or more **Decks**
- A **Match** has multiple **MatchPlayer** entries (one per deck/player in that game)
- **MatchPlayers** is the join table linking a deck to a match, with placement and win result

---

## Tables

### `Users`

Stores the players in the group.

| Column      | Type          | Constraints     | Description                        |
|-------------|---------------|-----------------|------------------------------------|
| `userid`    | INT           | PK, AUTO_INCREMENT | Unique identifier for the player |
| `firstname` | VARCHAR(32)   | nullable        | Player's first name                |
| `lastname`  | VARCHAR(32)   | nullable        | Player's last name                 |

---

### `Decks`

Stores each Commander deck owned by a player.

| Column        | Type          | Constraints              | Description                                              |
|---------------|---------------|--------------------------|----------------------------------------------------------|
| `deckid`      | INT           | PK, AUTO_INCREMENT       | Unique identifier for the deck                           |
| `deckname`    | VARCHAR(64)   | NOT NULL                 | Display name of the deck (usually the commander's name)  |
| `commander`   | VARCHAR(128)  | nullable                 | Full name of the primary commander card                  |
| `partnername` | VARCHAR(128)  | nullable                 | Name of the partner commander (if applicable)            |
| `color`       | VARCHAR(16)   | nullable                 | Color identity (e.g. `WUB`, `RG`, `WURBG`)              |
| `manavalue`   | INT           | nullable                 | Mana value (converted mana cost) of the commander        |
| `image_url`   | VARCHAR(256)  | nullable                 | URL to the commander's card image                        |
| `ownerid`     | INT           | FK → `Users.userid`      | The player who owns this deck                            |

**Notes:**
- Color identity uses single-letter codes: `W` (White), `U` (Blue), `B` (Black), `R` (Red), `G` (Green)
- A 5-color deck is represented as `WURBG`
- The `commander` field stores the full card name; `deckname` is a shorter display label

---

### `Matches`

Stores each individual Commander game session.

| Column      | Type    | Constraints        | Description                                              |
|-------------|---------|--------------------|----------------------------------------------------------|
| `match_id`  | INT     | PK, AUTO_INCREMENT | Unique identifier for the match                          |
| `played_at` | DATE    | nullable           | Date the match was played (`YYYY-MM-DD`)                 |
| `group_id`  | INT     | default `0`        | Group identifier (for future multi-group support)        |
| `comment`   | TEXT    | nullable           | Optional notes about the match (e.g. special rules, draw)|

**Notes:**
- A match with all players having `won = 1` in `MatchPlayers` represents a draw (see match 17)
- `group_id` is currently always `0`; reserved for future use

---

### `MatchPlayers`

Join table linking decks to matches. Each row represents one deck's participation in one match.

| Column      | Type        | Constraints              | Description                                              |
|-------------|-------------|--------------------------|----------------------------------------------------------|
| `id`        | INT         | PK, AUTO_INCREMENT       | Unique identifier for this entry                         |
| `match_id`  | INT         | FK → `Matches.match_id`  | The match this entry belongs to                          |
| `deck_id`   | INT         | FK → `Decks.deckid`      | The deck that participated                               |
| `placement` | TINYINT     | nullable                 | Final placement in the match (1 = winner, 2 = second...) |
| `won`       | TINYINT(1)  | NOT NULL, default `0`    | Whether this deck won the match (`1` = yes, `0` = no)    |

**Notes:**
- `placement` and `won` are typically consistent: placement `1` → `won = 1`
- In a draw, all participating entries have `won = 1` and `placement = 1`
- To get all matches for a player, join through `Decks` on `ownerid`

---

## Legacy Table: `MTGMatches`

> ⚠️ This table is no longer actively used. It was the original match-tracking table before `Matches` + `MatchPlayers` were introduced.

| Column         | Type          | Description                                              |
|----------------|---------------|----------------------------------------------------------|
| `match_id`     | INT           | Unique identifier                                        |
| `Decklist`     | VARCHAR(255)  | Comma-separated list of deck names (e.g. `"Chulane, Giada, Urza"`) |
| `match_result` | VARCHAR(128)  | Comma-separated results (e.g. `"0, 1, 0"`)              |
| `date`         | VARCHAR(10)   | Date string in `DD.MM.YY` format                         |
| `group_id`     | INT           | Group identifier                                         |
| `comment`      | TEXT          | Optional notes                                           |

This table is kept for historical reference. All new match data uses `Matches` + `MatchPlayers`.

---

## Common Queries

**Get all matches played by a specific player:**
```sql
SELECT DISTINCT mp.match_id, m.played_at, d.deckname, mp.placement, mp.won
FROM MatchPlayers mp
JOIN Decks d ON mp.deck_id = d.deckid
JOIN Matches m ON mp.match_id = m.match_id
WHERE d.ownerid = 1
ORDER BY m.played_at DESC;
```

**Get win rate per deck:**
```sql
SELECT d.deckname, COUNT(*) AS total_matches, SUM(mp.won) AS wins,
       ROUND(SUM(mp.won) / COUNT(*) * 100, 1) AS win_rate_pct
FROM MatchPlayers mp
JOIN Decks d ON mp.deck_id = d.deckid
GROUP BY d.deckid, d.deckname
ORDER BY win_rate_pct DESC;
```

**Get full detail for a match:**
```sql
SELECT m.match_id, m.played_at, m.comment,
       d.deckname, u.firstname, u.lastname, mp.placement, mp.won
FROM Matches m
JOIN MatchPlayers mp ON m.match_id = mp.match_id
JOIN Decks d ON mp.deck_id = d.deckid
JOIN Users u ON d.ownerid = u.userid
WHERE m.match_id = 1
ORDER BY mp.placement;
```

---

## Entity Relationship Summary

![Databaseschema](/docs/images/database-schema.png)
```
Users
  userid (PK)
  firstname, lastname
    │
    │ 1:N (owns)
    ▼
Decks
  deckid (PK)
  deckname, commander, partnername
  color, manavalue, image_url
  ownerid (FK → Users)
    │
    │ 1:N (played in)
    ▼
MatchPlayers ◄──── Matches
  id (PK)            match_id (PK)
  match_id (FK)      played_at
  deck_id (FK)       group_id
  placement          comment
  won
```
