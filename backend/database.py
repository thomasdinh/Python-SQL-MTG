from dotenv import load_dotenv
from sqlalchemy import create_engine, text, Column, Integer, String, Date, ForeignKey, Index
from sqlalchemy.orm import sessionmaker, declarative_base
from contextlib import contextmanager
import pydoc
import os

load_dotenv('login.env')

HOST = 'localhost'
if os.getenv("DB_HOST"):
    HOST = os.getenv("DB_HOST")
PORT = 3306
if os.getenv("DB_PORT"):
    PORT = int(os.getenv("DB_PORT"))
PASSWORD = os.getenv("DB_PASSWORD")
USER = os.getenv("DB_USER")
DATABASE = os.getenv("DB_NAME")

Base = declarative_base()


# ── Engine ────────────────────────────────────────────────────────────────────

def get_engine():
    """Create and return a SQLAlchemy engine."""
    try:
        engine = create_engine(
            f'mysql+pymysql://{USER}:{PASSWORD}@{HOST}:{PORT}/{DATABASE}',
            # Pages now fire several requests in parallel (e.g. the deck detail
            # page loads the deck, its match history, the full match list, the
            # full deck list, and the player list all at once for its filter
            # panels) — 2+2=4 total connections was tight enough to queue
            # requests under normal use. 5+5=10 gives more headroom.
            # If your DB plan has a low max_connections limit (common on free
            # tiers), check that before raising this further.
            pool_size=5,           # keep 5 connections open permanently
            max_overflow=5,        # allow 5 extra in bursts → 10 total
            pool_timeout=30,      # wait up to 30s for a connection before erroring
            pool_recycle=1800,    # recycle connections every 30min to avoid stale ones
            pool_pre_ping=True,   # reconnect if a connection drops
            echo=False,           # set True to log all SQL statements
        )
        print(f'Connected to {DATABASE}...')
        return engine
    except Exception as ex:
        print("Connection could not be made due to the following error:\n", ex)
        raise


# ── Session factory ───────────────────────────────────────────────────────────

engine = get_engine()
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


@contextmanager
def get_session():
    """Context manager that provides a transactional session."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


# ── DatabaseManager ───────────────────────────────────────────────────────────

class DatabaseManager:
    """High-level helpers for common SQL operations."""

    # ── Raw queries ───────────────────────────────────────────────────────────

    @staticmethod
    def execute_query(query: str, params: dict = None) -> list[dict]:
        """
        Execute a raw SELECT query and return rows as a list of dicts.

        Usage:
            rows = db.execute_query("SELECT * FROM cards WHERE set_code = :set", {"set": "NEO"})
        """
        with get_session() as session:
            result = session.execute(text(query), params or {})
            columns = result.keys()
            return [dict(zip(columns, row)) for row in result.fetchall()]

    @staticmethod
    def execute_update(query: str, params: dict = None) -> int:
        """
        Execute a raw INSERT / UPDATE / DELETE and return the number of rows affected.

        Usage:
            count = db.execute_update("UPDATE cards SET price = :price WHERE id = :id",
                                      {"price": 9.99, "id": 42})
        """
        with get_session() as session:
            result = session.execute(text(query), params or {})
            return result.rowcount

    # ── ORM helpers ───────────────────────────────────────────────────────────

    @staticmethod
    def select(model, filters: dict = None) -> list:
        """
        SELECT rows from an ORM model, optionally filtered by column=value pairs.

        Usage:
            users = db.select(User, {"firstname": "Thomas"})
        """
        with get_session() as session:
            query = session.query(model)
            if filters:
                for column, value in filters.items():
                    query = query.filter(getattr(model, column) == value)
            results = query.all()
            """session.expunge_all()
            return results """
            return [ {col.name: getattr(row, col.name) for col in model.__table__.columns}
                for row in results
            ]


    @staticmethod
    def insert(record) -> None:
        """
        INSERT a single ORM record.

        Usage:
            db.insert(User(userid=5,firstname="Asura", lastname="Redacted"))
        """
        with get_session() as session:
          
            session.add(record)
            session.flush()
            session.refresh(record)
            data = {c.name: getattr(record, c.name) 
                for c in record.__table__.columns}
            print(f"Inserted: {data}")
            return data

    @staticmethod
    def update(model, filters: dict, updates: dict) -> int:
        """
        UPDATE rows matching filters with the given column=value pairs.
        Returns the number of rows affected.

        Usage:
            db.update(User, {"firstname": "Thomas"},{"lastname": "Redacted"})
        """
        with get_session() as session:
            query = session.query(model)
            for column, value in filters.items():
                query = query.filter(getattr(model, column) == value)
            count = query.update(updates, synchronize_session=False)
            print(f"Updated {count} row(s)")
            
            return count

    @staticmethod
    def delete(model, filters: dict) -> int:
        """
        DELETE rows matching filters.
        Returns the number of rows affected.

        Usage:
            db.delete(User, "firstname": "Asura",)
            db.delete(User, {"firstname": "Asura", "lastname": "Redacted"}) - 2 params
        """
        with get_session() as session:
            query = session.query(model)
            for column, value in filters.items():
                query = query.filter(getattr(model, column) == value)
            count = query.delete(synchronize_session=False)
            print(f"Deleted {count} row(s)")
            return count


# ── Example ORM model ─────────────────────────────────────────────────────────


class Deck(Base):
    """A Commander deck owned by a player."""
    __tablename__ = 'Decks'
    __table_args__ = (
        Index('idx_decks_ownerid', 'ownerid'),
    )

    deckid        = Column(Integer, primary_key=True, autoincrement=True)
    deckname      = Column(String(32), nullable=False)
    partnername    = Column(String(32))
    color   = Column(String(16))
    manavalue = Column(Integer)
    # ForeignKey + ondelete here mirrors migrations/003_add_foreign_keys.sql —
    # this only takes effect for brand-new databases created via
    # Base.metadata.create_all(); an existing database needs that migration
    # run directly, since create_all() never alters existing tables.
    ownerid = Column(Integer, ForeignKey('Users.userid', ondelete='RESTRICT', onupdate='CASCADE'))
    image_url = Column(String(255))

    def __repr__(self):
        return f"<Deck(deckid={self.deckid}, deckname='{self.deckname}', partnername='{self.partnername}', color='{self.color}', manavalue={self.manavalue}, ownerid={self.ownerid}, image_url='{self.image_url}')>"

class MtgMatch(Base):
    """A single Commander game session.
    parameters:
    - match_id: unique identifier for each match (primary key)
        - Decklist: name of the deck used in the match (string, not null)
        - match_result: outcome of the match (string, e.g., 'win', 'loss', 'draw')
        - date: date of the match (string, not null, format 'YYYY-MM-DD')
        - group_id: identifier for the group or tournament (integer)
        - comment: optional notes about the match (string)"""
    __tablename__ = 'MTGMatches'
    __table_args__ = (
        Index('idx_mtgmatches_date', 'date'),
        Index('idx_mtgmatches_group_id', 'group_id'),
    )

    match_id        = Column(Integer, primary_key=True, autoincrement=True)
    Decklist      = Column(String(256), nullable=False)
    match_result    = Column(String(128))
    date      = Column(String(10), nullable=False)
    group_id       = Column(Integer)
    comment           = Column(String(256))

    def __repr__(self):
        return f"<MtgMatch(match_id={self.match_id}, Decklist='{self.Decklist}', match_result='{self.match_result}', date={self.date}, group_id={self.group_id}, comment='{self.comment}')>"

class User(Base):
    """Example model for users."""
    __tablename__ = 'Users'

    userid        = Column(Integer, primary_key=True, autoincrement=True)
    firstname     = Column(String(32), nullable=False)
    lastname         = Column(String(32), nullable=False)

    def __iter__(self):
        yield 'userid', self.userid
        yield 'firstname', self.firstname
        yield 'lastname', self.lastname
    

    def __repr__(self):
        return f"<User(userid={self.userid}, firstname='{self.firstname}', lastname='{self.lastname}')>"
    
class MatchPlayer(Base):
    """One deck's participation in one match — the join table between Decks and MTGMatches."""
    __tablename__ = 'MatchPlayers'
    __table_args__ = (
        Index('idx_matchplayers_deck_won', 'deck_id', 'won'),
        Index('idx_matchplayers_match_id', 'match_id'),
    )

    id        = Column(Integer, primary_key=True, autoincrement=True)
    match_id  = Column(Integer, ForeignKey('MTGMatches.match_id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
    deck_id = Column(Integer, ForeignKey('Decks.deckid', ondelete='RESTRICT', onupdate='CASCADE'), nullable=False)
    placement = Column(Integer, nullable=False)
    won = Column(Integer, nullable=False)  # 1 for win, 0 for loss

    def __repr__(self):
        return f"<MatchPlayer(id={self.id}, match_id={self.match_id}, deck_id={self.deck_id}, placement={self.placement}, won={self.won})>"
# ── Quick smoke-test ──────────────────────────────────────────────────────────

if __name__ == '__main__':

    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Connection successful!", result.fetchone())
    except Exception as e:
        print("❌ Connection failed:", e)
    """
    db = DatabaseManager()
    matches = db.select(Deck, {"deckname":"Pantlaza"})
    print(matches)
    """

    # --- Raw SELECT ---
    """ print("\n── Raw SELECT ──────────────────────────────────")
    rows = db.execute_query("SELECT * FROM cards LIMIT 5")
    for row in rows:
        print(row) """

    """ # --- ORM SELECT with filter ---
    print("\n── ORM SELECT (filter by set_code) ─────────────")
    cards = db.select(Card, {"set_code": "NEO"})
    for card in cards:
        print(card)

    # --- Raw UPDATE ---
    print("\n── Raw UPDATE ──────────────────────────────────")
    affected = db.execute_update(
        "UPDATE cards SET price = :price WHERE id = :id",
        {"price": 999, "id": 1}
    )
    print(f"Rows updated: {affected}")

    # --- ORM INSERT ---
    print("\n── ORM INSERT ──────────────────────────────────")
    new_card = Card(name="Black Lotus", set_code="LEA", rarity="Rare", price=50000)
    db.insert(new_card) """

    # --- ORM DELETE ---
    # db.delete(Card, {"name": "Black Lotus"})