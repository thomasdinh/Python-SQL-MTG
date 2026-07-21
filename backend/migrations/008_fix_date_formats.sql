-- Finds and fixes match dates that aren't stored as proper YYYY-MM-DD
-- strings. `date` is a plain VARCHAR column (see docs/database.md), so
-- "sort by newest" is really just a string comparison — it only produces
-- correct results if every single row is actually formatted YYYY-MM-DD.
-- One row stored as "31.03.25" instead of "2025-03-31" will sort as if
-- it were year "31", ahead of anything from 2020 onward, silently and
-- without any error.

-- ── Step 1: find every row that ISN'T proper YYYY-MM-DD ─────────────────
-- A correct value matches exactly 4 digits, a dash, 2 digits, a dash, 2
-- digits (e.g. 2025-03-31). Anything else gets listed here.
SELECT match_id, date, comment
FROM MTGMatches
WHERE date NOT REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
ORDER BY match_id;

-- ── Step 2: fix the common alternate formats ─────────────────────────────
-- Covers DD.MM.YY and DD.MM.YYYY (the two formats this app's CSV importer
-- has ever accepted as input — if Step 1 shows something in neither of
-- these shapes, it didn't come from the importer and needs a manual look
-- before you touch it).

-- DD.MM.YY  (e.g. "31.03.25" -> "2025-03-31")
UPDATE MTGMatches
SET date = CONCAT(
    '20', SUBSTRING(date, 7, 2), '-',
    SUBSTRING(date, 4, 2), '-',
    SUBSTRING(date, 1, 2)
)
WHERE date REGEXP '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{2}$';

-- DD.MM.YYYY  (e.g. "31.03.2025" -> "2025-03-31")
UPDATE MTGMatches
SET date = CONCAT(
    SUBSTRING(date, 7, 4), '-',
    SUBSTRING(date, 4, 2), '-',
    SUBSTRING(date, 1, 2)
)
WHERE date REGEXP '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$';

-- ── Step 3: confirm — should return zero rows ────────────────────────────
SELECT match_id, date, comment
FROM MTGMatches
WHERE date NOT REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
ORDER BY match_id;
-- If this still shows rows, they're in a format Step 2 doesn't recognize —
-- paste what comes back and they can be handled specifically rather than
-- guessed at.
