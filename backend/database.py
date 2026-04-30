import sqlite3
import os
import gzip
import shutil
from contextlib import contextmanager

DB_PATH = os.getenv("DATABASE_PATH", "ayta.db")
BUNDLED_GZ = os.path.join(os.path.dirname(__file__), "ayta.db.gz")


def _seed_if_missing():
    if os.path.exists(DB_PATH) or not os.path.exists(BUNDLED_GZ):
        return
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    print(f"Decompressing database to {DB_PATH} ...")
    with gzip.open(BUNDLED_GZ, "rb") as src, open(DB_PATH, "wb") as dst:
        shutil.copyfileobj(src, dst)
    print("Seed complete.")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    _seed_if_missing()
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS posts (
                id          TEXT PRIMARY KEY,  -- Reddit submission_id (varchar)
                title       TEXT NOT NULL,
                body        TEXT NOT NULL,
                verdict     TEXT,              -- derived from comment voting: YTA/NTA/ESH/NAH
                yta_count   INTEGER DEFAULT 0,
                nta_count   INTEGER DEFAULT 0,
                esh_count   INTEGER DEFAULT 0,
                nah_count   INTEGER DEFAULT 0,
                poster_age  INTEGER,
                poster_sex  TEXT,
                score       INTEGER,
                permalink   TEXT,
                created_utc TEXT
            );

            CREATE TABLE IF NOT EXISTS user_verdicts (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                post_id     TEXT NOT NULL REFERENCES posts(id),
                session_id  INTEGER NOT NULL,
                verdict     TEXT NOT NULL,
                created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
            );
                           
            CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts
            USING fts5(id UNINDEXED, title, body, tokenize='porter ascii')
        """)
