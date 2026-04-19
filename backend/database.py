import sqlite3
from contextlib import contextmanager

DB_PATH = "ayta.db"


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
                id          TEXT PRIMARY KEY,
                title       TEXT NOT NULL,
                body        TEXT NOT NULL,
                verdict     TEXT,
                score       INTEGER,
                num_comments INTEGER,
                created_utc INTEGER
            );

            CREATE TABLE IF NOT EXISTS user_verdicts (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                post_id     TEXT NOT NULL REFERENCES posts(id),
                session_id  TEXT NOT NULL,
                verdict     TEXT NOT NULL,
                created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """)
