-- ============================================================
--  MTG Tracker — Schema Migration
--  Migrates from the old MTGMatches/Users/Decks structure
--  to a normalized schema with a MatchPlayers join table.
--  Run this file top to bottom in order.
-- ============================================================


-- ------------------------------------------------------------
-- STEP 1: Recreate Users with AUTO_INCREMENT and proper data
-- ------------------------------------------------------------

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS Users;
CREATE TABLE Users (
    userid    INT          PRIMARY KEY AUTO_INCREMENT,
    firstname VARCHAR(32),
    lastname  VARCHAR(32)
);

INSERT INTO Users (firstname, lastname) VALUES
    ('Thomas',  'Dinh'),
    ('Peter',   'Geheim'),
    ('Kristian','Privat'),
    ('Steven',  'Secret'),
    ('Olli',    'Diskret');

-- userid 1=Thomas, 2=Peter, 3=Kristian, 4=Steven, 5=Olli
-- Adjust the deck ownership below to match your real ownership!


-- ------------------------------------------------------------
-- STEP 2: Recreate Decks with AUTO_INCREMENT
--         Commander names are taken from your match history.
--         Assign deckownerid based on who actually owns each deck.
-- ------------------------------------------------------------

DROP TABLE IF EXISTS Decks;
CREATE TABLE Decks (
    deckid      INT          PRIMARY KEY AUTO_INCREMENT,
    deckname    VARCHAR(64)  NOT NULL,
    commander   VARCHAR(128),
    partnername VARCHAR(128),               -- for partner commanders
    color       VARCHAR(16),
    manavalue   INT,
    image_url   VARCHAR(256),
    ownerid     INT NOT NULL,
    FOREIGN KEY (ownerid) REFERENCES Users(userid)
);

-- All unique commanders extracted from your match history.
-- Set ownerid (1–5) to whoever owns each deck.
-- Duplicates like "Obeka 2" are separate decks from the original Obeka.
INSERT INTO Decks (deckname, ownerid) VALUES
    ('Otharri',        1),
    ('Tymna',          1),
    ('Urza',           1),
    ('Chulane',        2),
    ('Giada',          2),
    ('Morophon',       2),
    ('Ghired',         1),
    ('Jodah',          3),
    ('Aesi',           3),
    ('Pantlaza',       1),
    ('Feather',        2),
    ('Radagast',       4),
    ('Etali',          3),
    ('Eluge',          1),
    ('Ulalek',         2),
    ('Narci',          4),
    ('Edgar',          2),
    ('Saheeli',        3),
    ('Coram',          4),
    ('Omnath',         1),
    ('Obeka',          5),
    ('Atraxa',         2),
    ('Kalamax',        3),
    ('Wilhelt',        4),
    ('Yedora',         5),
    ('Ixhel',          1),
    ('Tahngart',       2),
    ('Arna',           3),
    ('Yarok',          4),
    ('Kaalia',         5),
    ('Sythis',         1),
    ('Xyris',          2),
    ('Mishra',         3),
    ('Kinnan',         4),
    ('Atla',           5),
    ('Marrow-Gnawer',  1),
    ('Rocco',          2),
    ('Gitrog',         3),
    ('Prosper',        4),
    ('Temmet',         5),
    ('Obeka 2',        5),
    ('Baylen',         1),
    ('Voja',           2),
    ('Animar',         3),
    ('Hashaton',       4),
    ('Henzie',         5),
    ('Betor',          1),
    ('Lightpaws',      2),
    ('Ixhel',          2);  -- intentional: if a second player owns a copy


-- ------------------------------------------------------------
-- STEP 3: Create the new Matches table
-- ------------------------------------------------------------

DROP TABLE IF EXISTS Matches;
CREATE TABLE Matches (
    match_id   INT  PRIMARY KEY AUTO_INCREMENT,
    played_at  DATE,
    group_id   INT  DEFAULT 0,
    comment    TEXT
);


-- ------------------------------------------------------------
-- STEP 4: Create MatchPlayers — the core join table
-- ------------------------------------------------------------

DROP TABLE IF EXISTS MatchPlayers;
CREATE TABLE MatchPlayers (
    id        INT     PRIMARY KEY AUTO_INCREMENT,
    match_id  INT     NOT NULL,
    deck_id   INT     NOT NULL,
    placement TINYINT,                        -- 1 = winner, 2 = 2nd, etc.
    won       BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (match_id) REFERENCES Matches(match_id),
    FOREIGN KEY (deck_id)  REFERENCES Decks(deckid)
);


-- ------------------------------------------------------------
-- STEP 5: Migrate all 61 existing matches
--
--  Each old row becomes:
--    1 row in Matches
--    N rows in MatchPlayers (one per commander in Decklist)
--
--  The old format was:
--    Decklist:     "DeckA, DeckB, DeckC"
--    match_result: "1, 0, 0"   (parallel list — index of 1 is the winner)
--
--  date format DD.MM.YY or DD.MM.YYYY → converted to DATE via STR_TO_DATE
--
--  NOTE: deck_id references are looked up by deckname from Decks.
--        If you renamed any deck above, update the name here too.
-- ------------------------------------------------------------

-- Helper: insert match + players in one block per old match_id.
-- Format: INSERT INTO Matches then INSERT INTO MatchPlayers.
-- won=1 for the winner (result index = 1), won=0 otherwise.
-- placement follows the result order (1st=1, 2nd=2, etc.).

-- Match 1: Otharri(W), Tymna, Urza  | 20.10.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('20.10.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Otharri'  LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Tymna'    LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Urza'     LIMIT 1), 3, 0);

-- Match 2: Chulane, Giada(W), Urza  | 20.10.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('20.10.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Chulane'  LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Giada'    LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Urza'     LIMIT 1), 3, 0);

-- Match 3: Chulane, Morophon, Ghired(W)  | 20.10.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('20.10.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Chulane'  LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Morophon' LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ghired'   LIMIT 1), 1, 1);

-- Match 4: Jodah, Aesi, Pantlaza(W)  | 20.10.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('20.10.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Jodah'    LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Aesi'     LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Pantlaza' LIMIT 1), 1, 1);

-- Match 5: Jodah, Feather, Pantlaza(W)  | 20.10.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('20.10.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Jodah'    LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Feather'  LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Pantlaza' LIMIT 1), 1, 1);

-- Match 6: Otharri, Radagast(W), Urza  | 20.10.24
INSERT INTO Matches (played_at, group_id, comment) VALUES (STR_TO_DATE('20.10.24','%d.%m.%y'), 0, 'check there are 5 wins in 6 matches');
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Otharri'  LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Radagast' LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Urza'     LIMIT 1), 3, 0);

-- Match 7: Etali(W), Eluge, Ulalek, Narci  | 27.10.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('27.10.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Etali'    LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Eluge'    LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ulalek'   LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Narci'    LIMIT 1), 4, 0);

-- Match 8: Edgar(W), Saheeli, Narci, Coram  | 27.10.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('27.10.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Edgar'    LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Saheeli'  LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Narci'    LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Coram'    LIMIT 1), 4, 0);

-- Match 9: Coram(W), Omnath, Giada, Edgar  | 27.10.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('27.10.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Coram'    LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Omnath'   LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Giada'    LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Edgar'    LIMIT 1), 4, 0);

-- Match 10: Aesi(W), Obeka, Ghired, Prosper  | 07.12.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('07.12.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Aesi'     LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Obeka'    LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ghired'   LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Prosper'  LIMIT 1), 4, 0);

-- Match 11: Atraxa(W), Obeka, Tymna, Ghired  | 07.12.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('07.12.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Atraxa'   LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Obeka'    LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Tymna'    LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ghired'   LIMIT 1), 4, 0);

-- Match 12: Prosper(W), Obeka, Morophon, Ghired  | 07.12.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('07.12.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Prosper'  LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Obeka'    LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Morophon' LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ghired'   LIMIT 1), 4, 0);

-- Match 13: Kalamax(W), Obeka, Narci, Pantlaza  | 07.12.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('07.12.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Kalamax'  LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Obeka'    LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Narci'    LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Pantlaza' LIMIT 1), 4, 0);

-- Match 14: Saheeli(W), Obeka, Narci, Kalamax  | 07.12.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('07.12.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Saheeli'  LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Obeka'    LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Narci'    LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Kalamax'  LIMIT 1), 4, 0);

-- Match 15: Pantlaza(W), Wilhelt, Narci, Atraxa  | 07.12.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('07.12.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Pantlaza' LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Wilhelt'  LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Narci'    LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Atraxa'   LIMIT 1), 4, 0);

-- Match 16: Ghired(W), Yedora, Edgar, Ixhel  | 15.12.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('15.12.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ghired'   LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Yedora'   LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Edgar'    LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ixhel'    LIMIT 1), 4, 0);

-- Match 17: Edgar, Ghired, Yedora, Ixhel — result "1,1,1,1" = draw/everyone wins
-- Stored as won=1 for all, placement left equal at 1
INSERT INTO Matches (played_at, group_id, comment) VALUES (STR_TO_DATE('15.12.24','%d.%m.%y'), 0, 'Draw — all players won');
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Edgar'    LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ghired'   LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Yedora'   LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ixhel'    LIMIT 1), 1, 1);

-- Match 18: Tahngart(W), Jodah, Arna, Edgar, Ixhel  | 15.12.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('15.12.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Tahngart' LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Jodah'    LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Arna'     LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Edgar'    LIMIT 1), 4, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ixhel'    LIMIT 1), 5, 0);

-- Match 19: Yarok(W), Urza, Tymna, Kaalia  | 15.12.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('15.12.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Yarok'    LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Urza'     LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Tymna'    LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Kaalia'   LIMIT 1), 4, 0);

-- Match 20: Sythis(W), Xyris, Kaalia, Arna  | 15.12.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('15.12.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Sythis'   LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Xyris'    LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Kaalia'   LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Arna'     LIMIT 1), 4, 0);

-- Match 21: Eluge(W), Ixhel, Omnath  | 22.12.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('22.12.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Eluge'    LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ixhel'    LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Omnath'   LIMIT 1), 3, 0);

-- Match 22: Eluge(W), Ixhel, Omnath  | 22.12.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('22.12.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Eluge'    LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ixhel'    LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Omnath'   LIMIT 1), 3, 0);

-- Match 23: Eluge(W), Ixhel, Mishra  | 22.12.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('22.12.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Eluge'    LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ixhel'    LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Mishra'   LIMIT 1), 3, 0);

-- Match 24: Mishra(W), Ixhel, Edgar  | 22.12.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('22.12.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Mishra'   LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ixhel'    LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Edgar'    LIMIT 1), 3, 0);

-- Match 25: Mishra, Ixhel, Edgar(W)  | 22.12.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('22.12.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Mishra'   LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ixhel'    LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Edgar'    LIMIT 1), 1, 1);

-- Match 26: Aesi(W), Edgar, Mishra  | 22.12.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('22.12.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Aesi'     LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Edgar'    LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Mishra'   LIMIT 1), 3, 0);

-- Match 27: Kinnan(W), Etali, Morophon  | 22.12.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('22.12.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Kinnan'   LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Etali'    LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Morophon' LIMIT 1), 3, 0);

-- Match 28: Etali(W), Edgar, Giada  | 22.12.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('22.12.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Etali'    LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Edgar'    LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Giada'    LIMIT 1), 3, 0);

-- Match 29: Chulane, Kinnan(W), Urza, Ixhel  | 29.12.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('29.12.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Chulane'  LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Kinnan'   LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Urza'     LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ixhel'    LIMIT 1), 4, 0);

-- Match 30: Atla(W), Kinnan, Saheeli, Feather  | 29.12.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('29.12.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Atla'     LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Kinnan'   LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Saheeli'  LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Feather'  LIMIT 1), 4, 0);

-- Match 31: Ixhel(W), Tahngart, Kinnan, Jodah  | 29.12.24
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('29.12.24','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ixhel'    LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Tahngart' LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Kinnan'   LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Jodah'    LIMIT 1), 4, 0);

-- Match 32: Edgar(W), Saheeli, Aesi, Marrow-Gnawer  | 19.01.25
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('19.01.25','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Edgar'         LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Saheeli'       LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Aesi'          LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Marrow-Gnawer' LIMIT 1), 4, 0);

-- Match 33: Edgar(W), Saheeli, Ixhel, Rocco  | 19.01.25
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('19.01.25','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Edgar'    LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Saheeli'  LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ixhel'    LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Rocco'    LIMIT 1), 4, 0);

-- Match 34: Ixhel(W), Sythis, Etali, Gitrog  | 19.01.25
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('19.01.25','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ixhel'    LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Sythis'   LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Etali'    LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Gitrog'   LIMIT 1), 4, 0);

-- Match 35: Eluge(W), Morophon, Ulalek, Omnath  | 25.01.25
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('25.01.25','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Eluge'    LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Morophon' LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ulalek'   LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Omnath'   LIMIT 1), 4, 0);

-- Match 36: Eluge(W), Coram, Tahngart, Ixhel  | 25.01.25
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('25.01.25','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Eluge'    LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Coram'    LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Tahngart' LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ixhel'    LIMIT 1), 4, 0);

-- Match 37: Kinnan(W), Pantlaza, Otharri, Giada  | 25.01.25
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('25.01.25','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Kinnan'   LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Pantlaza' LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Otharri'  LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Giada'    LIMIT 1), 4, 0);

-- Match 38: Kinnan(W), Pantlaza, Kaalia, Giada  | 25.01.25
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('25.01.25','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Kinnan'   LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Pantlaza' LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Kaalia'   LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Giada'    LIMIT 1), 4, 0);

-- Match 39: Edgar, Kaalia, Giada(W), Tahngart  | 25.01.25
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('25.01.25','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Edgar'    LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Kaalia'   LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Giada'    LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Tahngart' LIMIT 1), 4, 0);

-- Match 40: Ixhel(W), Temmet, Kaalia  | 16.02.2025
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('16.02.2025','%d.%m.%Y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ixhel'    LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Temmet'   LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Kaalia'   LIMIT 1), 3, 0);

-- Match 41: Ixhel(W), Temmet, Marrow-Gnawer  | 16.02.2025
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('16.02.2025','%d.%m.%Y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ixhel'         LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Temmet'        LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Marrow-Gnawer' LIMIT 1), 3, 0);

-- Match 42: Morophon(W), Temmet, Urza  | 16.02.2025
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('16.02.2025','%d.%m.%Y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Morophon' LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Temmet'   LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Urza'     LIMIT 1), 3, 0);

-- Match 43: Mishra(W), Feather, Urza, Baylen  | 16.02.2025
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('16.02.2025','%d.%m.%Y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Mishra'   LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Feather'  LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Urza'     LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Baylen'   LIMIT 1), 4, 0);

-- Match 44: Baylen(W), Feather, Urza, Mishra  | 16.02.2025
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('16.02.2025','%d.%m.%Y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Baylen'   LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Feather'  LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Urza'     LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Mishra'   LIMIT 1), 4, 0);

-- Match 45: Kaalia(W), Temmet, Obeka 2, Feather  | 16.02.2025
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('16.02.2025','%d.%m.%Y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Kaalia'   LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Temmet'   LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Obeka 2'  LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Feather'  LIMIT 1), 4, 0);

-- Match 46: Voja(W), Temmet, Aesi, Animar  | 31.03.25
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('31.03.25','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Voja'     LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Temmet'   LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Aesi'     LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Animar'   LIMIT 1), 4, 0);

-- Match 47: Aesi(W), Temmet, Voja, Animar  | 31.03.25
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('31.03.25','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Aesi'     LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Temmet'   LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Voja'     LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Animar'   LIMIT 1), 4, 0);

-- Match 48: Tymna(W), Obeka 2, Voja, Urza  | 31.03.25
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('31.03.25','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Tymna'    LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Obeka 2'  LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Voja'     LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Urza'     LIMIT 1), 4, 0);

-- Match 49: Saheeli(W), Kinnan, Obeka 2, Ixhel  | 01.04.25
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('01.04.25','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Saheeli'  LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Kinnan'   LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Obeka 2'  LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ixhel'    LIMIT 1), 4, 0);

-- Match 50: Temmet(W), Hashaton, Ixhel, Baylen, Eluge  | 01.04.25
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('01.04.25','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Temmet'   LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Hashaton' LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ixhel'    LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Baylen'   LIMIT 1), 4, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Eluge'    LIMIT 1), 5, 0);

-- Match 51: Edgar(W), Henzie, Temmet, Baylen  | 07.04.25
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('07.04.25','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Edgar'    LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Henzie'   LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Temmet'   LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Baylen'   LIMIT 1), 4, 0);

-- Match 52: Baylen(W), Henzie, Temmet, Baylen — note: two Baylen decks
-- Treating as same deck for now; set different deckids if two players own Baylen
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('07.04.25','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Baylen'   LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Henzie'   LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Temmet'   LIMIT 1), 3, 0);

-- Match 53: Edgar(W), Henzie, Omnath, Animar  | 07.04.25
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('07.04.25','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Edgar'    LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Henzie'   LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Omnath'   LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Animar'   LIMIT 1), 4, 0);

-- Match 54: Henzie(W), Voja, Obeka 2, Omnath  | 07.04.25
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('07.04.25','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Henzie'   LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Voja'     LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Obeka 2'  LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Omnath'   LIMIT 1), 4, 0);

-- Match 55: Henzie(W), Voja, Obeka 2, Omnath  | 07.04.25 (duplicate game)
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('07.04.25','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Henzie'   LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Voja'     LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Obeka 2'  LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Omnath'   LIMIT 1), 4, 0);

-- Match 56: Obeka 2(W), Henzie, Temmet, Eluge, Jodah  | 07.04.25
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('07.04.25','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Obeka 2'  LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Henzie'   LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Temmet'   LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Eluge'    LIMIT 1), 4, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Jodah'    LIMIT 1), 5, 0);

-- Match 57: Ixhel(W), Temmet, Betor, Ulalek, Edgar  | 07.04.25
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('07.04.25','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ixhel'    LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Temmet'   LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Betor'    LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Ulalek'   LIMIT 1), 4, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Edgar'    LIMIT 1), 5, 0);

-- Match 58: Betor(W), Mishra, Voja, Hashaton, Henzie  | 07.04.25
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('07.04.25','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Betor'    LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Mishra'   LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Voja'     LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Hashaton' LIMIT 1), 4, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Henzie'   LIMIT 1), 5, 0);

-- Match 59: Voja(W), Betor, Arna, Mishra, Henzie  | 07.04.25
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('07.04.25','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Voja'     LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Betor'    LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Arna'     LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Mishra'   LIMIT 1), 4, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Henzie'   LIMIT 1), 5, 0);

-- Match 60: Eluge(W), Lightpaws, Pantlaza, Betor  | 07.04.25
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('07.04.25','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Eluge'      LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Lightpaws'  LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Pantlaza'   LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Betor'      LIMIT 1), 4, 0);

-- Match 61: Eluge(W), Obeka 2, Omnath, Atla  | 07.04.25
INSERT INTO Matches (played_at, group_id) VALUES (STR_TO_DATE('07.04.25','%d.%m.%y'), 0);
SET @m = LAST_INSERT_ID();
INSERT INTO MatchPlayers (match_id, deck_id, placement, won) VALUES
    (@m, (SELECT deckid FROM Decks WHERE deckname='Eluge'    LIMIT 1), 1, 1),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Obeka 2'  LIMIT 1), 2, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Omnath'   LIMIT 1), 3, 0),
    (@m, (SELECT deckid FROM Decks WHERE deckname='Atla'     LIMIT 1), 4, 0);


-- ------------------------------------------------------------
-- STEP 6: Drop the old table (safe to run after verifying data)
-- ------------------------------------------------------------

-- DROP TABLE MTGMatches;  -- uncomment once you've verified the migration

SET FOREIGN_KEY_CHECKS = 1;


-- ------------------------------------------------------------
-- STEP 7: Useful verification queries
-- ------------------------------------------------------------

-- Confirm match count matches original 61
SELECT COUNT(*) AS total_matches FROM Matches;

-- Deck win rates (sort by win rate descending)
SELECT
    d.deckname,
    COUNT(*)                            AS games,
    SUM(mp.won)                         AS wins,
    ROUND(SUM(mp.won) / COUNT(*) * 100, 1) AS win_pct
FROM MatchPlayers mp
JOIN Decks d ON d.deckid = mp.deck_id
GROUP BY d.deckid, d.deckname
HAVING games >= 3
ORDER BY win_pct DESC;

-- All matches with their participants
SELECT
    m.match_id,
    m.played_at,
    GROUP_CONCAT(d.deckname ORDER BY mp.placement SEPARATOR ', ') AS decks,
    MAX(CASE WHEN mp.won = 1 THEN d.deckname END)                 AS winner
FROM Matches m
JOIN MatchPlayers mp ON mp.match_id = m.match_id
JOIN Decks d         ON d.deckid    = mp.deck_id
GROUP BY m.match_id, m.played_at
ORDER BY m.played_at;