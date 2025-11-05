"""
User routes: Get current user info
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header, Cookie
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.database import get_db
from app.models import User
from app.schemas import UserResponse
from app.security import JWT_SECRET_KEY, JWT_ALGORITHM

router = APIRouter(prefix="/api/user", tags=["User"])


def get_current_user(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
    access_token: str | None = Cookie(default=None),
) -> User:
    """
    JWT 토큰으로 현재 사용자 조회 (로컬스토리지 or 쿠키 인증 모두 지원)
    """
    token = None

    # ✅ Authorization 헤더 우선
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]

    # ✅ 없으면 쿠키 사용 (소셜 로그인)
    if not token and access_token:
        token = access_token

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
        )

    try:
        print("[INFO] JWT_SECRET_KEY: ", JWT_SECRET_KEY);
        print(JWT_ALGORITHM)
        print("1")
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        print("2")
        print(token)
        print(payload)
        print("3")
        user_id = payload.get("sub")
        print("4")
        print(user_id)
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        print("5")
        user = db.query(User).filter(User.id == int(user_id)).first()
        print("6")
        if not user or user.status != "ACTIVE":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

        return user

    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials 111")
    
    # try:
    #     # Bearer 토큰 파싱
    #     scheme, token = authorization.split()
    #     if scheme.lower() != "bearer":
    #         raise HTTPException(
    #             status_code=status.HTTP_401_UNAUTHORIZED,
    #             detail="Invalid authentication scheme"
    #         )
        
    #     # JWT 디코딩
    #     payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    #     user_id: str = payload.get("sub")
    #     if user_id is None:
    #         raise HTTPException(
    #             status_code=status.HTTP_401_UNAUTHORIZED,
    #             detail="Invalid token"
    #         )
        
    #     # 사용자 조회
    #     user = db.query(User).filter(User.id == int(user_id)).first()
    #     if user is None or user.status != "ACTIVE":
    #         raise HTTPException(
    #             status_code=status.HTTP_401_UNAUTHORIZED,
    #             detail="User not found or inactive"
    #         )
        
    #     return user
    
    except (JWTError, ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials 222"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    현재 로그인한 사용자 정보 조회
    """
    return UserResponse.from_orm(current_user)
