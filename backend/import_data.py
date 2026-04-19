# One-time script to import the Kaggle AITA SQLite database into our app database.
#
# The Kaggle DB has two tables:
#   submission(id, submission_id, title, selftext, created_utc, permalink, score)
#   comment(id, submission_id, message, comment_id, parent_id, created_utc, score)
#
# Since the dataset has no verdict/flair column, we derive the verdict from
# comment text: for each post, sum the scores of comments containing each
# verdict keyword and take the winner.
#
# Usage:
#   python import_data.py path/to/kaggle.db

import re
import sys
import sqlite3
from database import init_db, get_db

VERDICT_KEYWORDS = ["YTA", "NTA", "ESH", "NAH"]
KEYWORD_PATTERN = re.compile(r"\b(YTA|NTA|ESH|NAH)\b", re.IGNORECASE)


def tally_verdicts(comments: list[tuple[str, int]]) -> dict[str, int]:
    """
    Given a list of (message, score) tuples, return a dict of cumulative scores
    per verdict keyword. Each comment contributes once per keyword it contains.
    Downvoted and null-score comments are ignored.
    """
    totals: dict[str, int] = {k: 0 for k in VERDICT_KEYWORDS}
    for message, score in comments:
        if not message:
            continue
        found = set(m.upper() for m in KEYWORD_PATTERN.findall(message))
        for keyword in found:
            if keyword in totals:
                totals[keyword] += max(score or 0, 0)
    return totals


def import_db(source_path: str):
    """
    Given the source path to 'AmItheAsshole.sqlite, downloaded from kaggle,
    initialize the database using this data and run all data analyses we want to perform.
    This should include deriving the verdict of each comment. Future features include finding the demographic information
    of the post's user, and finding keyword information to regarding the poster's scenario (ex. 
    family disagreements, relationship drama, coworker problems, etc...)
    """
    init_db()

    src = sqlite3.connect(source_path)
    src.row_factory = sqlite3.Row

    submissions = src.execute(
        "SELECT submission_id, title, selftext, created_utc, permalink, score FROM submission"
    ).fetchall()

    # comment.submission_id stores the same alphanumeric Reddit ID as submission.submission_id
    # despite being declared INTEGER — SQLite stores it as text due to flexible typing
    raw_comments = src.execute(
        "SELECT submission_id, message, score FROM comment"
    ).fetchall()

    comments_by_post: dict[str, list[tuple[str, int]]] = {}
    for c in raw_comments:
        comments_by_post.setdefault(str(c["submission_id"]), []).append(
            (c["message"], c["score"])
        )

    records = []
    for row in submissions:
        if not row["title"] or not row["selftext"]:
            continue
        if len(row["selftext"]) < 50:
            continue

        post_comments = comments_by_post.get(row["submission_id"], [])
        totals = tally_verdicts(post_comments)
        best = max(totals, key=lambda k: totals[k])
        verdict = best if totals[best] > 0 else None

        records.append({
            "id": row["submission_id"],
            "title": row["title"],
            "body": row["selftext"],
            "verdict": verdict,
            "yta_count": totals["YTA"],
            "nta_count": totals["NTA"],
            "esh_count": totals["ESH"],
            "nah_count": totals["NAH"],
            "score": row["score"],
            "permalink": row["permalink"],
            "created_utc": str(row["created_utc"]),
        })

    src.close()

    with get_db() as conn:
        conn.executemany(
            """INSERT OR REPLACE INTO posts (id, title, body, verdict, yta_count, nta_count, esh_count, nah_count, score, permalink, created_utc)
               VALUES (:id, :title, :body, :verdict, :yta_count, :nta_count, :esh_count, :nah_count, :score, :permalink, :created_utc)""",
            records,
        )

    with_verdict = sum(1 for r in records if r["verdict"])
    print(f"Imported {len(records)} posts ({with_verdict} with derived verdicts).")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python import_data.py <path_to_kaggle.db>")
        sys.exit(1)
    import_db(sys.argv[1])
