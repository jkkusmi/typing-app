from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.score import Score
from app.schemas.score import ScoreCreate
from app.auth.deps import get_current_user

router = APIRouter(
    prefix="/scores",
    tags=["Scores"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()




@router.post("/")
def create_score(
    request: ScoreCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    new_score = Score(
        score=request.score,
        game_type=request.game_type,
        text_type=request.text_type,
        language=request.language,
        wpm=request.wpm,
        user_id=current_user["user_id"]
    )

    db.add(new_score)
    db.commit()
    db.refresh(new_score)

    return {
        "message": "Score saved",
        "score_id": new_score.id
    }

@router.get("/")
def get_scores(db: Session = Depends(get_db)):

    scores = (
        db.query(Score)
        .order_by(Score.wpm.desc())
        .all()
    )

    return [
        {
            "id": s.id,
            "score": s.score,
            "game_type": s.game_type,
            "text_type": s.text_type,
            "language": s.language,
            "wpm": s.wpm,
            "user_id": s.user_id,
            "achieved_at": s.achieved_at,
            "username": s.user.username if s.user else "Unknown",
        }
        for s in scores
    ]



@router.get("/me")
def get_my_scores(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    scores = (
        db.query(Score)
        .filter(Score.user_id == current_user["user_id"])
        .order_by(Score.score.desc())
        .all()
    )

    return scores