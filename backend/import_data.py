"""
One-time script to import the Kaggle AITA dataset into SQLite.

Usage:
    python import_data.py path/to/aita_dataset.csv

The CSV is expected to have at minimum these columns (Jian Loong Liew dataset):
    id, title, selftext, link_flair_text, score, num_comments, created_utc
"""

import sys
import pandas as pd
from database import init_db, get_db

VERDICT_MAP = {
    "Asshole": "YTA",
    "Not the A-hole": "NTA",
    "Everyone Sucks": "ESH",
    "No A-holes here": "NAH",
}


def import_csv(path: str):
    init_db()
    df = pd.read_csv(path)

    df = df.rename(columns={"selftext": "body", "link_flair_text": "verdict"})
    df["verdict"] = df["verdict"].map(VERDICT_MAP)

    # Drop posts with missing body or extremely short content
    df = df.dropna(subset=["id", "title", "body"])
    df = df[df["body"].str.len() > 50]

    records = df[["id", "title", "body", "verdict", "score", "num_comments", "created_utc"]].to_dict("records")

    with get_db() as conn:
        conn.executemany(
            """INSERT OR IGNORE INTO posts (id, title, body, verdict, score, num_comments, created_utc)
               VALUES (:id, :title, :body, :verdict, :score, :num_comments, :created_utc)""",
            records,
        )

    print(f"Imported {len(records)} posts.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python import_data.py <path_to_csv>")
        sys.exit(1)
    import_csv(sys.argv[1])
