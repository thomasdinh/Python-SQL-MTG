-- Deletes a specific batch of matches (and their MatchPlayers rows) —
-- e.g. to undo a bad CSV import. Filter by whichever of the three options
-- below actually identifies your bad batch; delete or comment out the
-- ones you don't need. Preview first, always.
--
-- match_id is auto-increment, so the most recently imported batch is
-- always the highest, contiguous range of IDs — run
--   SELECT MAX(match_id) FROM MTGMatches;
-- right after a bad import to find the top of the range, and count the
-- rows in your CSV to work out where it starts.

-- ── Step 1: preview what would be deleted ────────────────────────────────
-- Adjust the WHERE clause to whichever filter actually identifies your
-- bad batch. All three are OR'd together below as an example — normally
-- you'd only use one.
SELECT m.match_id, m.date, m.group_id, m.comment, COUNT(mp.id) AS player_count
FROM MTGMatches m
LEFT JOIN MatchPlayers mp ON mp.match_id = m.match_id
WHERE
    m.match_id BETWEEN 373 AND 500        -- ← option A: a known match_id range
    -- OR m.date BETWEEN '2025-04-01' AND '2025-04-30'   -- ← option B: a date range from the bad CSV
    -- OR m.group_id = 0                                  -- ← option C: everything in a specific playgroup
GROUP BY m.match_id, m.date, m.group_id, m.comment
ORDER BY m.match_id;

-- Sanity check the count before deleting anything:
SELECT COUNT(*) AS matches_to_delete
FROM MTGMatches m
WHERE m.match_id BETWEEN 373 AND 500;

-- ── Step 2: delete ────────────────────────────────────────────────────────
-- MatchPlayers first (in case your database doesn't have the
-- ON DELETE CASCADE from migration 003/005 applied yet — this way it
-- works regardless), then the matches themselves.
DELETE mp FROM MatchPlayers mp
JOIN MTGMatches m ON m.match_id = mp.match_id
WHERE m.match_id BETWEEN 373 AND 500;

DELETE FROM MTGMatches
WHERE match_id BETWEEN 373 AND 500;

-- ── Step 3: confirm ────────────────────────────────────────────────────────
SELECT COUNT(*) AS remaining_in_range
FROM MTGMatches
WHERE match_id BETWEEN 373 AND 500;
-- should be 0
