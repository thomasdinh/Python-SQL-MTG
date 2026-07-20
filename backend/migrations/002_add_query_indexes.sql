-- Additional indexes for the filtering/sorting/tier-list features.
--
-- 001_add_indexes.sql covered the basic foreign-key lookups. This migration
-- adds indexes for the query patterns introduced since: sorting/filtering
-- matches by date, filtering by playgroup, and computing win-rate
-- aggregates per deck.
--
-- Run once against your database, e.g.:
--   mysql -u <user> -p <database> < backend/migrations/002_add_query_indexes.sql

ALTER TABLE MTGMatches
    ADD INDEX idx_mtgmatches_date (date),
    ADD INDEX idx_mtgmatches_group_id (group_id);

-- Composite index covering the (deck_id, won) pair used by /decks/with-stats'
-- COUNT(mp.id)/SUM(mp.won) aggregate — lets MySQL satisfy that aggregate
-- from the index itself instead of reading every matching row.
-- If idx_matchplayers_deck_id from 001_add_indexes.sql already exists,
-- this composite index supersedes it for that column; you can drop the
-- single-column one afterward if you want to save space:
--   ALTER TABLE MatchPlayers DROP INDEX idx_matchplayers_deck_id;
ALTER TABLE MatchPlayers
    ADD INDEX idx_matchplayers_deck_won (deck_id, won);
