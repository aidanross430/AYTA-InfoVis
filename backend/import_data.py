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

VERDICT_KEYWORDS = ["YTA", "NTA"]
KEYWORD_PATTERN = re.compile(r"\b(YTA|NTA)\b", re.IGNORECASE)

# Demographic tag — age+gender or gender+age inside brackets or parenthesis
# Groups: (age_first, gender_first, gender_second, age_second)
# One pair will be populated and the other will be null
_TAG = (
    r"[\[(]\s*(?:"
    r"(\d{1,3})\s*(m(?:ale)?|f(?:emale)?|nb|non-?binary)"   # [25M] => [25, male, None, None]
    r"|"
    r"(m(?:ale)?|f(?:emale)?|nb|non-?binary)\s*,?\s*(\d{1,3})"  # [F25] => [female, 25, None, None]
    r")\s*[\])]"
)

# It is assumed that any matches in the title will refer to the poster first
_TITLE_DEMO = re.compile(_TAG, re.IGNORECASE)

# In the body, require a personal identifier within 5 characters before the tag.
# Covers: "I [25M]", "I'm (F30)", "me [NB21]", "I, [25M]", "I am a (30F), my (40f)"
# The strict 5 character limit means it will include instances like "my [40f]" but NOT
# instances like "my dad [M38]"
_BODY_DEMO = re.compile(
    r"\b(?:I(?:'m)?|[Mm]e|[Mm]y)\b[^[(\n]{0,5}" + _TAG,
    re.IGNORECASE,
)


def _extract_demo(m: re.Match) -> tuple[int, str]:
    """Pull (age, sex) out of a _TAG match (works for both title and body patterns)."""
    groups = m.groups()
    age_a, gen_a, gen_b, age_b = groups[-4], groups[-3], groups[-2], groups[-1]
    age, gender = (age_a, gen_a) if age_a is not None else (age_b, gen_b)
    return int(age), _normalize_gender(gender)


def _normalize_gender(raw: str) -> str:
    r = raw.lower()
    if r in ("m", "male"):
        return "M"
    if r in ("f", "female"):
        return "F"
    return "NB"


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

def poster_demographic(title: str, body: str) -> tuple[int | None, str | None]:
    """
    Parse the poster's age and sex from an AITA post.
    - Body: only tags preceded by a personal identifier are used
    - Title: any tag is assumed to refer to the poster
    Returns (age, sex) e.g. (25, "M"), (30, "F"), (22, "NB").
    Falls back to (None, None) if no matching tag is found.
    """
    m = _BODY_DEMO.search(body)
    if m:
        return _extract_demo(m)
    m = _TITLE_DEMO.search(title)
    if m:
        return _extract_demo(m)
    return None, None

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
        age, sex = poster_demographic(row["title"], row["selftext"])

        records.append({
            "id": row["submission_id"],
            "title": row["title"],
            "body": row["selftext"],
            "verdict": verdict,
            "yta_count": totals["YTA"],
            "nta_count": totals["NTA"],
            "poster_age": age,
            "poster_sex": sex,
            "score": row["score"],
            "permalink": row["permalink"],
            "created_utc": str(row["created_utc"]),
        })

    src.close()

    with get_db() as conn:
        conn.executemany(
            """INSERT OR REPLACE INTO posts (id, title, body, verdict, yta_count, nta_count, poster_age, poster_sex, score, permalink, created_utc)
               VALUES (:id, :title, :body, :verdict, :yta_count, :nta_count, :poster_age, :poster_sex, :score, :permalink, :created_utc)""",
            records,
        )

    with_verdict = sum(1 for r in records if r["verdict"])
    with_demo   = sum(1 for r in records if r["poster_age"] is not None)
    print(f"Imported {len(records)} posts "
          f"({with_verdict} with verdicts, {with_demo} with demographics).")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python import_data.py <path_to_kaggle.db>")
        sys.exit(1)
    import_db(sys.argv[1])
