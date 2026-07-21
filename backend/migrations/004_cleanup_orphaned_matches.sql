-- Cleanup for orphaned matches created by the (now-fixed) match-player
-- creation bug: every failed import/log attempt still created the match
-- row successfully before failing on the match-player step, leaving a
-- match with zero players attached behind. This finds and removes those.
--
-- Safe by construction: it only ever touches a match that has NO rows in
-- MatchPlayers at all. A match with real data (even just one player) is
-- never touched by any statement below.

-- ── Step 1: see how many you actually have ─────────────────────────────
SELECT COUNT(*) AS orphaned_match_count
FROM MTGMatches m
LEFT JOIN MatchPlayers mp ON mp.match_id = m.match_id
WHERE mp.id IS NULL;

-- ── Step 2: preview them before deleting anything ───────────────────────
-- Skim this list — every row here has 0 players attached. If you see a
-- match_id you recognize as real, stop and investigate before continuing;
-- that would mean something other than the known bug is going on.
SELECT m.match_id, m.date, m.group_id, m.comment
FROM MTGMatches m
LEFT JOIN MatchPlayers mp ON mp.match_id = m.match_id
WHERE mp.id IS NULL
ORDER BY m.match_id;

-- ── Step 3: delete them ──────────────────────────────────────────────────
-- Only run this after Step 2's preview looks like what you expect —
-- entirely orphaned matches, nothing you'd recognize as a real game.
DELETE m FROM MTGMatches m
LEFT JOIN MatchPlayers mp ON mp.match_id = m.match_id
WHERE mp.id IS NULL;

-- ── Step 4: confirm ───────────────────────────────────────────────────────
SELECT COUNT(*) AS remaining_orphans
FROM MTGMatches m
LEFT JOIN MatchPlayers mp ON mp.match_id = m.match_id
WHERE mp.id IS NULL;
-- should be 0
