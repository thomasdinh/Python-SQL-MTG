from dotenv import load_dotenv
from sqlalchemy import create_engine, text, Column, Integer, String, Date
from sqlalchemy.orm import sessionmaker, declarative_base
from contextlib import contextmanager
import os

load_dotenv('login.env')

HOST = 'localhost'
PORT = 3306
PASSWORD = os.getenv("DB_PASSWORD")
USER = os.getenv("DB_USER")
DATABASE = 'mtgdb'

Base = declarative_base()


# ── Engine ────────────────────────────────────────────────────────────────────

def get_engine():
    """Create and return a SQLAlchemy engine."""
    try:
        engine = create_engine(
            f'mysql+pymysql://{USER}:{PASSWORD}@{HOST}:{PORT}/{DATABASE}',
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
    """Example model for decks."""
    __tablename__ = 'Decks'

    deckid        = Column(Integer, primary_key=True, autoincrement=True)
    deckname      = Column(String(32), nullable=False)
    partnername    = Column(String(32))
    color   = Column(String(16))
    manavalue = Column(Integer)
    ownerid = Column(Integer)
    image_url = Column(String(255))

    def __repr__(self):
        return f"<Deck(deckid={self.deckid}, deckname='{self.deckname}', partnername='{self.partnername}', color='{self.color}', manavalue={self.manavalue}, ownerid={self.ownerid}, image_url='{self.image_url}')>"

class MtgMatch(Base):
    """Example model for matches."""
    __tablename__ = 'MTGMatches'

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
    """Example model for match players."""
    __tablename__ = 'MatchPlayers'

    id        = Column(Integer, primary_key=True, autoincrement=True)
    match_id  = Column(Integer, nullable=False)
    deck_id = Column(Integer, nullable=False)
    placement = Column(Integer, nullable=False)
    won = Column(Integer, nullable=False)  # 1 for win, 0 for loss

    def __repr__(self):
        return f"<MatchPlayer(id={self.id}, match_id={self.match_id}, deck_id={self.deck_id}, placement={self.placement}, won={self.won})>"
# ── Quick smoke-test ──────────────────────────────────────────────────────────

if __name__ == '__main__':
    db = DatabaseManager()
    matches = db.select(Deck, {"deckname":"Pantlaza"})
    print(matches)
   

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