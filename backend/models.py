from pydantic import BaseModel
from typing import Optional


class Post(BaseModel):
    id: str
    title: str
    body: str
    verdict: Optional[str]
    score: Optional[int]
    num_comments: Optional[int]


class VerdictSubmission(BaseModel):
    post_id: str
    session_id: str
    verdict: str  # "YTA" | "NTA" | "ESH" | "NAH"


class VerdictCount(BaseModel):
    verdict: str
    count: int


class StatsResponse(BaseModel):
    total_posts: int
    total_user_verdicts: int
    verdict_distribution: list[VerdictCount]
    user_verdict_distribution: list[VerdictCount]
