from pydantic import BaseModel
from datetime import datetime


class ScoreCreate(BaseModel):
    score: float
    game_type: str
    text_type: str
    language: str
    wpm: float


class ScoreResponse(BaseModel):
    id: int
    score: float
    game_type: str
    text_type: str
    language: str
    wpm: float
    user_id: int
    achieved_at: datetime

    class Config:
        from_attributes = True