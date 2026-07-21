-- Resets the AUTO_INCREMENT counter on each table back down to the
-- smallest value that's still safe — MAX(id) + 1 if the table has rows,
-- or 1 if it's completely empty. This doesn't change any existing row's
-- ID, only where the *next* new row starts counting from.
--
-- Why this needs dynamic SQL: `ALTER TABLE x AUTO_INCREMENT = ?` doesn't
-- accept a bind parameter or subquery directly — the value has to be a
-- literal. Each block below computes the right value first, then builds
-- and runs the ALTER TABLE as a string.
--
-- Safe to run any time — deleting rows never lowers a table's
-- AUTO_INCREMENT automatically (that's why you can end up with, say,
-- MTGMatches starting its next ID at 500 even after cleaning up down to
-- a handful of rows), and setting it back down to MAX(id)+1 can never
-- collide with a row that still exists.

-- ── Step 1: see the gap before touching anything ─────────────────────────
SELECT 'Users' AS table_name,
       (SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Users') AS current_next_id,
       (SELECT IFNULL(MAX(userid), 0) + 1 FROM Users) AS would_reset_to
UNION ALL
SELECT 'Decks',
       (SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Decks'),
       (SELECT IFNULL(MAX(deckid), 0) + 1 FROM Decks)
UNION ALL
SELECT 'MTGMatches',
       (SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'MTGMatches'),
       (SELECT IFNULL(MAX(match_id), 0) + 1 FROM MTGMatches)
UNION ALL
SELECT 'MatchPlayers',
       (SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'MatchPlayers'),
       (SELECT IFNULL(MAX(id), 0) + 1 FROM MatchPlayers);

-- ── Step 2: reset each one ────────────────────────────────────────────────

SET @next_id = (SELECT IFNULL(MAX(userid), 0) + 1 FROM Users);
SET @sql = CONCAT('ALTER TABLE Users AUTO_INCREMENT = ', @next_id);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @next_id = (SELECT IFNULL(MAX(deckid), 0) + 1 FROM Decks);
SET @sql = CONCAT('ALTER TABLE Decks AUTO_INCREMENT = ', @next_id);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @next_id = (SELECT IFNULL(MAX(match_id), 0) + 1 FROM MTGMatches);
SET @sql = CONCAT('ALTER TABLE MTGMatches AUTO_INCREMENT = ', @next_id);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @next_id = (SELECT IFNULL(MAX(id), 0) + 1 FROM MatchPlayers);
SET @sql = CONCAT('ALTER TABLE MatchPlayers AUTO_INCREMENT = ', @next_id);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── Step 3: confirm ────────────────────────────────────────────────────────
SELECT TABLE_NAME, AUTO_INCREMENT
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('Users', 'Decks', 'MTGMatches', 'MatchPlayers');
