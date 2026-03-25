SHOW databases;
--@block
TRUNCATE TABLE MTGMatches;
--@block
DROP TABLE MTGMatches;
--@block
CREATE TABLE MTGMatches (
    match_id INT PRIMARY KEY AUTO_INCREMENT,
    Decklist VARCHAR(255) NOT NULL,
    match_result VARCHAR(128),
    date VARCHAR(10),
    -- Custom date format
    group_id INT,
    comment TEXT
);

--@block
INSERT INTO MTGMatches (
        match_id,
        Decklist,
        match_result,
        date,
        group_id,
        comment
    )
VALUES (
        1,
        "Otharri, Tymna, Urza",
        "1, 0, 0",
        '20.10.24',
        0,
        NULL
    ),
    (
        2,
        "Chulane, Giada, Urza",
        "0, 1, 0",
        '20.10.24',
        0,
        NULL
    ),
    (
        3,
        "Chulane, Morophon, Ghired",
        "0, 0, 1",
        '20.10.24',
        0,
        NULL
    ),
    (
        4,
        "Jodah, Aesi, Pantlaza",
        "0, 0, 1",
        '20.10.24',
        0,
        NULL
    ),
    (
        5,
        "Jodah, Feather, Pantlaza",
        "0, 0, 1",
        '20.10.24',
        0,
        NULL
    ),
    (
        6,
        "Otharri, Radagast, Urza",
        "0, 1, 0",
        '20.10.24',
        0,
        'check there are 5 wins in 6 matches'
    ),
    (
        7,
        "Etali, Eluge, Ulalek, Narci",
        "1, 0, 0, 0",
        '27.10.24',
        0,
        NULL
    ),
    (
        8,
        "Edgar, Saheeli, Narci, Coram",
        "1, 0, 0, 0",
        '27.10.24',
        0,
        NULL
    ),
    (
        9,
        "Coram, Omnath, Giada, Edgar",
        "1, 0, 0, 0",
        '27.10.24',
        0,
        NULL
    ),
    (
        10,
        "Aesi, Obeka, Ghired, Prosper",
        "1, 0, 0, 0",
        '07.12.24',
        0,
        NULL
    ),
    (
        11,
        "Atraxa, Obeka, Tymna, Ghired",
        "1, 0, 0, 0",
        '07.12.24',
        0,
        NULL
    ),
    (
        12,
        "Prosper, Obeka, Morophon, Ghired",
        "1, 0, 0, 0",
        '07.12.24',
        0,
        NULL
    ),
    (
        13,
        "Kalamax, Obeka, Narci, Pantlaza",
        "1, 0, 0, 0",
        '07.12.24',
        0,
        NULL
    ),
    (
        14,
        "Saheeli, Obeka, Narci, Kalamax",
        "1, 0, 0,0",
        '07.12.24',
        0,
        NULL
    ),
    (
        15,
        "Pantlaza, Wilhelt, Narci, Atraxa",
        "1, 0, 0,0",
        '07.12.24',
        0,
        NULL
    ),
    (
        16,
        "Ghired, Yedora, Edgar, Ixhel",
        "1, 0, 0,0",
        '15.12.24',
        0,
        NULL
    ),
    (
        17,
        "Edgar, Ghired, Yedora, Ixhel",
        "1, 1, 1, 1",
        '15.12.24',
        0,
        NULL
    ),
    (
        18,
        "Tahngart, Jodah, Arna, Edgar, Ixhel",
        "1, 0, 0, 0, 0",
        '15.12.24',
        0,
        NULL
    ),
    (
        19,
        "Yarok, Urza, Tymna, Kaalia",
        "1, 0, 0,0",
        '15.12.24',
        0,
        NULL
    ),
    (
        20,
        "Sythis, Xyris, Kaalia, Arna",
        "1, 0, 0,0",
        '15.12.24',
        0,
        NULL
    ),
    (
        21,
        "Eluge, Ixhel, Omnath",
        "1,0,0",
        '22.12.24',
        0,
        NULL
    ),
    (
        22,
        "Eluge, Ixhel, Omnath",
        "1,0,0",
        '22.12.24',
        0,
        NULL
    ),
    (
        23,
        "Eluge, Ixhel, Mishra",
        "1,0,0",
        '22.12.24',
        0,
        NULL
    ),
    (
        24,
        "Mishra, Ixhel, Edgar",
        "1,0,0",
        '22.12.24',
        0,
        NULL
    ),
    (
        25,
        "Mishra, Ixhel, Edgar",
        "0, 0, 1",
        '22.12.24',
        0,
        NULL
    ),
    (
        26,
        "Aesi, Edgar, Mishra",
        "1,0,0",
        '22.12.24',
        0,
        NULL
    ),
    (
        27,
        "Kinnan, Etali, Morophon",
        "1,0,0",
        '22.12.24',
        0,
        NULL
    ),
    (
        28,
        "Etali, Edgar, Giada",
        "1,0,0",
        '22.12.24',
        0,
        NULL
    ),
    (
        29,
        "Chulane, Kinnan, Urza, Ixhel",
        "0,1,0,0",
        '29.12.24',
        0,
        NULL
    ),
    (
        30,
        "Atla, Kinnan, Saheeli, Feather",
        "1, 0, 0,0",
        '29.12.24',
        0,
        NULL
    ),
    (
        31,
        "Ixhel, Tahngart, Kinnan, Jodah",
        "1, 0, 0,0",
        '29.12.24',
        0,
        NULL
    ),
    (
        32,
        "Edgar, Saheeli, Aesi, Marrow-Gnawer",
        "1, 0, 0,0",
        '19.01.25',
        0,
        NULL
    ),
    (
        33,
        "Edgar, Saheeli, Ixhel, Rocco",
        "1,0,0,0",
        '19.01.25',
        0,
        NULL
    ),
    (
        34,
        "Ixhel, Sythis, Etali, Gitrog",
        "1,0,0,0",
        '19.01.25',
        0,
        NULL
    ),
    (
        35,
        "Eluge, Morophon, Ulalek, Omnath",
        "1,0,0,0",
        '25.01.25',
        0,
        NULL
    ),
    (
        36,
        "Eluge, Coram, Tahngart, Ixhel",
        "1,0,0,0",
        '25.01.25',
        0,
        NULL
    ),
    (
        37,
        "Kinnan, Pantlaza, Otharri, Giada",
        "1,0,0,0",
        '25.01.25',
        0,
        NULL
    ),
    (
        38,
        "Kinnan, Pantlaza, Kaalia, Giada",
        "1,0,0,0",
        '25.01.25',
        0,
        NULL
    ),
    (
        39,
        "Edgar, Kaalia, Giada, Tahngart",
        "0,0,1,0",
        '25.01.25',
        0,
        NULL
    ),
    (
        40,
        "Ixhel, Temmet, Kaalia",
        "1,0,0",
        '16.02.2025',
        0,
        NULL
    ),
    (
        41,
        "Ixhel, Temmet, Marrow-Gnawer",
        "1,0,0",
        '16.02.2025',
        0,
        NULL
    ),
    (
        42,
        "Morophon, Temmet, Urza",
        "1,0,0",
        '16.02.2025',
        0,
        NULL
    ),
    (
        43,
        "Mishra, Feather, Urza, Baylen",
        "1,0,0,0",
        '16.02.2025',
        0,
        NULL
    ),
    (
        44,
        "Baylen, Feather, Urza, Mishra",
        "1,0,0,0",
        '16.02.2025',
        0,
        NULL
    ),
    (
        45,
        "Kaalia, Temmet, Obeka 2, Feather",
        "1,0,0,0",
        '16.02.2025',
        0,
        NULL
    ),
    (
        46,
        "Voja,Temmet,Aesi,Animar",
        "1, 0, 0, 0",
        '31.03.25',
        0,
        NULL
    ),
    (
        47,
        "Aesi,Temmet,Voja,Animar",
        "1, 0, 0, 0",
        '31.03.25',
        0,
        NULL
    ),
    (
        48,
        "Tymna,Obeka 2,Voja,Urza",
        "[1, 0, 0, 0]",
        '31.03.25',
        0,
        NULL
    ),
    (
        49,
        "Saheeli, Kinnan, Obeka 2, Ixhel",
        "[1, 0, 0, 0]",
        '01.04.25',
        0,
        NULL
    ),
    (
        50,
        "Temmet,Hashaton,Ixhel,Baylen,Eluge",
        "[1, 0, 0, 0, 0]",
        '01.04.25',
        0,
        NULL
    ),
    (
        51,
        "Edgar, Henzie, Temmet, Baylen",
        "[1, 0, 0, 0]",
        '07.04.25',
        0,
        NULL
    ),
    (
        52,
        "Baylen, Henzie, Temmet, Baylen",
        "[1, 0, 0, 0]",
        '07.04.25',
        0,
        NULL
    ),
    (
        53,
        "Edgar, Henzie, Omnath, Animar",
        "[1, 0, 0, 0]",
        '07.04.25',
        0,
        NULL
    ),
    (
        54,
        "Henzie,Voja,Obeka 2, Omnath",
        "[1, 0, 0, 0]",
        '07.04.25',
        0,
        NULL
    ),
    (
        55,
        "Henzie,Voja,Obeka 2, Omnath",
        "[1, 0, 0, 0]",
        '07.04.25',
        0,
        NULL
    ),
    (
        56,
        "Obeka 2, Henzie, Temmet, Eluge, Jodah",
        "[1, 0, 0, 0, 0]",
        '07.04.25',
        0,
        NULL
    ),
    (
        57,
        "Ixhel, Temmet, Betor, Ulalek, Edgar",
        "[1, 0, 0, 0, 0]",
        '07.04.25',
        0,
        NULL
    ),
    (
        58,
        "Betor, Mishra, Voja, Hashaton, Henzie",
        "[1, 0, 0, 0, 0]",
        '07.04.25',
        0,
        NULL
    ),
    (
        59,
        "Voja, Betor, Arna, Mishra,Henzie",
        "[1, 0, 0, 0, 0]",
        '07.04.25',
        0,
        NULL
    ),
    (
        60,
        "Eluge, Lightpaws, Pantlaza, Betor",
        "[1, 0, 0, 0]",
        '07.04.25',
        0,
        NULL
    ),
    (
        61,
        "Eluge, Obeka 2, Omnath, Atla",
        "[1, 0, 0, 0]",
        '07.04.25',
        0,
        NULL
    );
--@block
SELECT *
FROM MTGMatches
WHERE Decklist LIKE '%Eluge%'
ORDER BY date ASC;

--@block
DROP TABLE Users;
--@block 

CREATE TABLE Users(
    userid INT PRIMARY KEY,
    firstname VARCHAR(32),
    lastname VARCHAR(32)
);
--@block
SET FOREIGN_KEY_CHECKS = 0;
ALTER TABLE Users MODIFY userid INT NOT NULL AUTO_INCREMENT;
SET FOREIGN_KEY_CHECKS = 1;
--@block
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE Users;
SET FOREIGN_KEY_CHECKS = 1; 
--@block
INSERT INTO Users(userid, firstname, lastname)
VALUES(NULL, 'Thomas', 'Dinh'),
    (NULL, 'Peter', 'Geheim'),
    (NULL, 'Kristian', 'Privat'),
    (NULL, 'Steven', 'Secret'),
    (NULL, 'Olli', 'Diskret');
--@block    
CREATE TABLE Decks(
    deckid INT,
    deckname VARCHAR(32),
    partnername VARCHAR(32),
    color VARCHAR(16),
    manavalue INT,
    deckownerid INT NOT NULL,
    PRIMARY KEY (deckid),
    FOREIGN KEY (deckownerid) REFERENCES users(userid)
);
--@block
INSERT INTO decks(deckid, deckname, color, manavalue, deckownerid)
VALUES(0, 'Pantlaza', 'RGW', 5, 0),
    (1, 'Mishra', 'BUR', 5, 0),
    (2, 'Ghired', 'RGW', 3, 0);
--@block
SELECT deckname,
    firstname,
    lastname
FROM Users
    INNER JOIN Decks ON Users.userid = Decks.deckownerid;
--@block
ALTER TABLE decks
ADD image_url VARCHAR(256);
--@block delete auto incr counter
ALTER TABLE Users AUTO_INCREMENT = 1;