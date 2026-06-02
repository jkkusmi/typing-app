from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest
from app.auth.password import hash_password, verify_password
from app.auth.jwt import create_access_token

router = APIRouter(prefix="/auth")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):

    user_exists = db.query(User).filter(
        User.email == request.email
    ).first()

    if user_exists:
        raise HTTPException(status_code=400, detail="Email already exists")

    new_user = User(
        username=request.username,
        first_name=request.first_name,
        last_name=request.last_name,
        email=request.email,
        hashed_password=hash_password(request.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User created",
        "user_id": new_user.id
    }


@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == request.email).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({
        "user_id": user.id,
        "username": user.username
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }