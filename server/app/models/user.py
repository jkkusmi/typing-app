from sqlalchemy import Column, Integer, String
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String, unique=True)
    hashed_password = Column(String)