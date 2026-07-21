-- Fixes: "Cannot add or update a child row: a foreign key constraint
-- fails ... CONSTRAINT `MatchPlayers_ibfk_1` FOREIGN KEY (`match_id`)
-- REFERENCES `Matches` (`match_id`)"
--
-- What's actually happening: MatchPlayers.match_id has a leftover foreign
-- key constraint (auto-named MatchPlayers_ibfk_1 by MySQL, meaning nobody
-- explicitly named it — it's original schema setup, not anything from
-- this project's migrations) pointing at a table called `Matches`. But
-- this app's Python model (`MtgMatch` in database.py) has `__tablename__
-- = 'MTGMatches'` — a different table — and that's where every match
-- actually gets created. Match creation succeeds every time; the very
-- next step (creating its match-players) then fails every time, because
-- the constraint checks match_id against a table that was never getting
-- the new rows.
--
-- This is almost certainly a rename that happened in the Python model at
-- some point (`Matches` -> `MTGMatches`) without the actual MySQL table
-- being renamed to match, or a fresh `MTGMatches` table getting created
-- alongside an old, now-abandoned `Matches` table.

-- ── Step 1: confirm the diagnosis ────────────────────────────────────────
-- See every foreign key currently on MatchPlayers. Expect to see
-- match_id's REFERENCED_TABLE_NAME come back as "Matches" — if it already
-- says "MTGMatches", this script doesn't apply to you and something else
-- is going on.
SELECT
    CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'MatchPlayers'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Check whether the old `Matches` table has any real data in it. This app
-- has never written to it (every match this whole time has gone into
-- MTGMatches instead), so this should come back 0 or very small — if it's
-- large, stop and look before continuing, since that would mean there's
-- real history sitting in a table this app has been ignoring.
SELECT COUNT(*) AS matches_table_row_count FROM `Matches`;

-- Compare against where matches actually are:
SELECT COUNT(*) AS mtgmatches_row_count FROM MTGMatches;

-- ── Step 2: point the constraint at the right table ──────────────────────
-- If Step 1's constraint name wasn't exactly "MatchPlayers_ibfk_1", swap
-- it in below before running this.
ALTER TABLE MatchPlayers DROP FOREIGN KEY MatchPlayers_ibfk_1;

ALTER TABLE MatchPlayers
    ADD CONSTRAINT fk_matchplayers_match_id
    FOREIGN KEY (match_id) REFERENCES MTGMatches(match_id)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Step 3: confirm the fix ───────────────────────────────────────────────
SELECT
    CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'MatchPlayers'
  AND REFERENCED_TABLE_NAME IS NOT NULL;
-- match_id's REFERENCED_TABLE_NAME should now say MTGMatches.

-- ── Step 4 ─────────────────────────────────────────────────────────────
-- Every match-player insert has likely been failing since before the CSV
-- importer even existed, which means there are more orphaned matches now
-- than when 004_cleanup_orphaned_matches.sql was written (match IDs in
-- the latest error batch went up to 422). Re-run that script after this
-- one — its Step 1 count will tell you exactly how many.
