# The FastAPI containing our endpoints

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, get_db
from models import Post, PostDetail, PostSummary, VerdictCounts, VerdictSubmission, StatsResponse, VerdictCount
from typing import Optional
import re
import random


app = FastAPI(title="AYTA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_methods=["*"],
    allow_headers=["*"],
)

STOP_WORDS = {"i", "me", "my", "am", "is", "the", "a", "an", "and", "or", "to", "in", "it", "of", "was", "for", "aita", "wibta"}

# Helper for not including the stop words in the FTS search
def extract_keywords(text: str) -> str:
    words = re.findall(r"[a-zA-Z]+", text.lower())
    keywords = [w for w in words if w not in STOP_WORDS and len(w) > 2]
    return " ".join(keywords)

@app.on_event("startup")
def startup():
    init_db()

@app.get("/api/posts/all", response_model=list[PostSummary])
def get_all_posts(q: Optional[str] = None):
    """
    Returns id, title, verdict, reddit and user verdict counts, poster age/sex,
    score, and permalink for every post. Intended for D3 visualizations.
    """
    with get_db() as conn:
        # If user has provided a query 
        if (q):
            match_query = extract_keywords(q)
            rows = conn.execute(
                """SELECT p.id, p.title, p.verdict, p.yta_count, p.nta_count,
                        p.esh_count, p.nah_count, p.poster_age, p.poster_sex,
                        p.score, p.permalink
                FROM posts p
                JOIN posts_fts f ON p.id = f.id
                WHERE posts_fts MATCH ?
                ORDER BY rank""",
                (match_query,)
            ).fetchall()

            user_rows = conn.execute(
                """SELECT uv.post_id, uv.verdict, COUNT(*) as count
                FROM user_verdicts uv
                JOIN posts_fts f ON uv.post_id = f.id
                WHERE posts_fts MATCH ?
                GROUP BY uv.post_id, uv.verdict""",
                (match_query,)
            ).fetchall()
        else:
            rows = conn.execute(
                """SELECT id, title, verdict, yta_count, nta_count, esh_count, nah_count,
                        poster_age, poster_sex, score, permalink
                FROM posts"""
            ).fetchall()

            # Aggregate user verdicts for all posts in one query instead of N+1
            user_rows = conn.execute(
                "SELECT post_id, verdict, COUNT(*) as count FROM user_verdicts GROUP BY post_id, verdict"
            ).fetchall()

    # Build lookup: {post_id: {verdict: count}}
    user_counts: dict[str, dict[str, int]] = {}
    for r in user_rows:
        user_counts.setdefault(r["post_id"], {})[r["verdict"]] = r["count"]

    return [
        PostSummary(
            id=row["id"],
            title=row["title"],
            verdict=row["verdict"],
            reddit_verdicts=VerdictCounts(
                yta=row["yta_count"],
                nta=row["nta_count"],
                esh=row["esh_count"],
                nah=row["nah_count"],
            ),
            user_verdicts=VerdictCounts(
                yta=user_counts.get(row["id"], {}).get("YTA", 0),
                nta=user_counts.get(row["id"], {}).get("NTA", 0),
                esh=user_counts.get(row["id"], {}).get("ESH", 0),
                nah=user_counts.get(row["id"], {}).get("NAH", 0),
            ),
            poster_age=row["poster_age"],
            poster_sex=row["poster_sex"],
            score=row["score"],
            permalink=row["permalink"],
        )
        for row in rows
    ]


@app.get("/api/posts/random", response_model=Post)
def get_random_post():
    """
    Returns a random post. Posts are weighted to intentionally return contested posts more often,
    in order to make the game more fun and interesting.
    """
    contested_ratio = 0.5       # probability of drawing a contested post
    contested_threshold = 0.3   # how close to 50/50 counts as "contested"

    use_contested = random.random() < contested_ratio

    with get_db() as conn:
        if use_contested:
            row = conn.execute("""
                SELECT * FROM posts
                WHERE (yta_count + nta_count) > 0
                AND ABS(CAST(yta_count AS REAL) / (yta_count + nta_count) - 0.5) <= :threshold
                ORDER BY RANDOM() LIMIT 1
            """, {"threshold": contested_threshold}).fetchone()
        else:
            row = conn.execute("""
                SELECT * FROM posts
                WHERE (yta_count + nta_count) > 0
                AND ABS(CAST(yta_count AS REAL) / (yta_count + nta_count) - 0.5) > :threshold
                ORDER BY RANDOM() LIMIT 1
            """, {"threshold": contested_threshold}).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="No posts in database")
    return Post(**dict(row))

@app.get("/api/posts/{post_id}", response_model=PostDetail)
def get_post(post_id: str):
    """
    Returns all of the information from a post of a specific idea. This includes
    both the reddit communities verdicts and the users' verdicts
    """
    with get_db() as conn:
        # Get all of the post's information, including counts for each verdict
        row = conn.execute(
            "SELECT * FROM posts WHERE id = ?", (post_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Post not found")

        # Sum all of the verdicts from the user responses. Should technically only be YTA and NTA,
        # but i've included the other two just in case (ESH, NAH)
        user_rows = conn.execute(
            "SELECT verdict, COUNT(*) as count FROM user_verdicts WHERE post_id = ? GROUP BY verdict",
            (post_id,),
        ).fetchall()

    user_counts = {r["verdict"]: r["count"] for r in user_rows}
    post = dict(row)
    return PostDetail(
        **post,
        reddit_verdicts=VerdictCounts(
            yta=post["yta_count"],
            nta=post["nta_count"],
            esh=post["esh_count"],
            nah=post["nah_count"],
        ),
        user_verdicts=VerdictCounts(
            yta=user_counts.get("YTA", 0),
            nta=user_counts.get("NTA", 0),
            esh=user_counts.get("ESH", 0),
            nah=user_counts.get("NAH", 0),
        ),
    )


@app.post("/api/verdicts", status_code=201)
def submit_verdict(payload: VerdictSubmission):
    """Record a user's verdict for a post."""
    with get_db() as conn:
        # Make sure post exists before trying to add to it
        post = conn.execute(
            "SELECT id FROM posts WHERE id = ?", (payload.post_id,)
        ).fetchone()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        conn.execute(
            "INSERT INTO user_verdicts (post_id, session_id, verdict) VALUES (?, ?, ?)",
            (payload.post_id, payload.session_id, payload.verdict),
        )
    return {"status": "ok"}

@app.get("/api/stats", response_model=StatsResponse)
def get_stats():
    """Aggregates data across the entire database."""
    with get_db() as conn:
        total_posts = conn.execute("SELECT COUNT(*) FROM posts").fetchone()[0]
        total_verdicts = conn.execute("SELECT COUNT(*) FROM user_verdicts").fetchone()[0]

        post_dist = conn.execute(
            "SELECT verdict, COUNT(*) as count FROM posts WHERE verdict IS NOT NULL GROUP BY verdict"
        ).fetchall()

        user_dist = conn.execute(
            "SELECT verdict, COUNT(*) as count FROM user_verdicts GROUP BY verdict"
        ).fetchall()

    return StatsResponse(
        total_posts=total_posts,
        total_user_verdicts=total_verdicts,
        verdict_distribution=[VerdictCount(**dict(r)) for r in post_dist],
        user_verdict_distribution=[VerdictCount(**dict(r)) for r in user_dist],
    )
