-- Indexes for MTG-SQL performance
--
-- None of the foreign-key-ish columns used in WHERE/JOIN clauses had an
-- index, so every lookup by deck, match, or player was a full table scan.
-- That's invisible at hobby-project scale (a few hundred rows) but is worth
-- fixing now since it costs nothing and only gets worse as data grows.
--
-- Run once against your database, e.g.:
--   mysql -u <user> -p <database> < backend/migrations/001_add_indexes.sql

ALTER TABLE MatchPlayers
    ADD INDEX idx_matchplayers_deck_id (deck_id),
    ADD INDEX idx_matchplayers_match_id (match_id);

ALTER TABLE Decks
    ADD INDEX idx_decks_ownerid (ownerid);
