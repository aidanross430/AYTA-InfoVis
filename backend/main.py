from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, get_db
from models import Post, VerdictSubmission, StatsResponse, VerdictCount

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


@app.get("/api/posts/random", response_model=Post)
def get_random_post():
    """Return a random post from the database for the game."""
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM posts ORDER BY RANDOM() LIMIT 1"
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="No posts in database")
    return Post(**dict(row))


@app.post("/api/verdicts", status_code=201)
def submit_verdict(payload: VerdictSubmission):
    """Record a user's verdict for a post."""
    with get_db() as conn:
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
    """Aggregate data for the visualization panel."""
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
