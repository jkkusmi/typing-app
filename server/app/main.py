from app.db.database import engine, Base
from app.models.user import User
from app.models.score import Score

Base.metadata.create_all(bind=engine)