import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.getenv("DATABASE_PATH", "ayta.db")


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
