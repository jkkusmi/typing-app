from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.database import Base

class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True)

    score = Column(Float)
    game_type = Column(String)
    text_type = Column(String)
    language = Column(String)

    user_id = Column(Integer, ForeignKey("users.id"))
    achieved_at = Column(DateTime, default=datetime.utcnow)

    wpm = Column(Float)
    

    user = relationship("User")