# Models.py contains pydantic/schema models to describe incoming and outgoing data from the API.

from pydantic import BaseModel
from typing import Optional


class Post(BaseModel):
    id: str
    title: str
    body: str
    verdict: Optional[str]   # YTA | NTA | ESH | NAH — derived from comments
    yta_count: int = 0
    nta_count: int = 0
    esh_count: int = 0
    nah_count: int = 0
    poster_age: Optional[int] = None
    poster_sex: Optional[str] = None  # "M" | "F" | "NB"
    score: Optional[int]
    permalink: Optional[str]


class VerdictCounts(BaseModel):
    yta: int = 0
    nta: int = 0
    esh: int = 0
    nah: int = 0


class PostDetail(Post):
    reddit_verdicts: VerdictCounts
    user_verdicts: VerdictCounts


class PostSummary(BaseModel):
    """Lightweight post shape for bulk responses used by D3 visualizations."""
    id: str
    title: str
    verdict: Optional[str]
    reddit_verdicts: VerdictCounts
    user_verdicts: VerdictCounts
    poster_age: Optional[int] = None
    poster_sex: Optional[str] = None
    score: Optional[int]
    permalink: Optional[str]


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
