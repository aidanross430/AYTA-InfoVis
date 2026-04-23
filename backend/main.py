# The FastAPI containing our endpoints

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, get_db
from models import Post, PostDetail, PostSummary, VerdictCounts, VerdictSubmission, StatsResponse, VerdictCount

app = FastAPI(title="AYTA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()

@app.get("/api/posts/all", response_model=list[PostSummary])
def get_all_posts():
    """
    Returns id, title, verdict, reddit and user verdict counts, poster age/sex,
    score, and permalink for every post. Intended for D3 visualizations.
    """
    with get_db() as conn:
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
    Returns all of the information from a random post in the database
    """
    # Return a random post from the database for the game.
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM posts ORDER BY RANDOM() LIMIT 1"
        ).fetchone()
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
