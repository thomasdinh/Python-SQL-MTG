-- Adds real foreign-key constraints. Currently `Decks.ownerid`,
-- `MatchPlayers.match_id`, and `MatchPlayers.deck_id` are plain integer
-- columns with no constraint at all — nothing stops you from deleting a
-- player who still owns decks, or a deck that still has match history,
-- leaving orphaned rows the API will happily 500 on later.
--
-- This migration is OPTIONAL and separate from 001/002 because, unlike an
-- index, adding a constraint can fail outright if your existing data
-- already has orphans (e.g. a deck whose owner was deleted before this
-- project had integrity checks). Run the checks below FIRST.
--
-- ── Step 1: check for orphans (run these; each should return 0 rows) ──────
--
-- SELECT * FROM Decks d LEFT JOIN Users u ON d.ownerid = u.userid WHERE u.userid IS NULL;
-- SELECT * FROM MatchPlayers mp LEFT JOIN MTGMatches m ON mp.match_id = m.match_id WHERE m.match_id IS NULL;
-- SELECT * FROM MatchPlayers mp LEFT JOIN Decks d ON mp.deck_id = d.deckid WHERE d.deckid IS NULL;
--
-- If any of those return rows, either delete the orphaned rows or fix their
-- reference before continuing — the ALTER TABLE below will fail otherwise.
--
-- ── Step 2: add the constraints ────────────────────────────────────────────
-- ON DELETE RESTRICT: blocks deleting a User/Deck/Match while dependent
-- rows still reference it, rather than silently cascading data loss. If you
-- want deleting a player to also delete their decks (and those decks'
-- match history), change RESTRICT to CASCADE for that constraint.

ALTER TABLE Decks
    ADD CONSTRAINT fk_decks_ownerid
    FOREIGN KEY (ownerid) REFERENCES Users(userid)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE MatchPlayers
    ADD CONSTRAINT fk_matchplayers_match_id
    FOREIGN KEY (match_id) REFERENCES MTGMatches(match_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT fk_matchplayers_deck_id
    FOREIGN KEY (deck_id) REFERENCES Decks(deckid)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Note: MatchPlayers → MTGMatches uses CASCADE (deleting a match should
-- clean up its player rows, matching what DELETE /matches/{id} already
-- assumes) but MatchPlayers → Decks and Decks → Users use RESTRICT, since
-- silently deleting a deck's entire match history because someone deleted
-- the deck record is more likely to be a mistake than a rename you want to
-- propagate.
