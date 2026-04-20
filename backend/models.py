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
