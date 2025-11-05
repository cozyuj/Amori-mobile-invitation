import os
from dotenv import load_dotenv

load_dotenv()

import uuid
import requests
from urllib.parse import urlencode
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Cookie
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, AuthProvider, AuthInfo
from app.schemas import LoginResponse, UserResponse
from app.security import create_access_token

router = APIRouter(prefix="/api/oauth", tags=["Authentication"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

@router.get("/google/login")
async def google_login():
    """
    구글 로그인 URL로 리디렉트
    """
    state = uuid.uuid4().hex
    params = {
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "state": state,
        "prompt": "consent"  # 항상 동의창 표시
    }
    url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    return RedirectResponse(url)


@router.get("/google/callback")
async def google_callback(code: str, state: str, db: Session = Depends(get_db)):
    """
    구글 OAuth 콜백
    - 토큰 요청
    - 사용자 정보 조회
    - 신규 유저 자동 생성
    - auth_info 테이블 저장
    - JWT 토큰 발급 및 리다이렉트
    """
    try:
        # --- 구글 토큰 요청 ---
        token_data = {
            "code": code,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "redirect_uri": REDIRECT_URI,
            "grant_type": "authorization_code",
        }

        token_response = requests.post(GOOGLE_TOKEN_URL, data=token_data)

        print(f"[DEBUG] 구글 토큰 응답: {token_response.text}")

        token_response.raise_for_status()
        tokens = token_response.json()
        access_token = tokens.get("access_token")

        id_token = tokens.get("id_token")
        refresh_token = tokens.get("refresh_token")
        expires_in = tokens.get("expires_in")

        if not access_token:
            raise HTTPException(status_code=400, detail="구글 액세스 토큰 발급 실패")
        
        expires_at = None
        if expires_in:
            expires_at = datetime.utcnow() + timedelta(seconds=int(expires_in))

        # --- 구글 사용자 정보 조회 ---
        headers = {"Authorization": f"Bearer {access_token}"}
        user_info_response = requests.get(GOOGLE_USERINFO_URL, headers=headers)
        user_info_response.raise_for_status()
        user_info = user_info_response.json()

        external_user_id = user_info.get("id")  # Google 계정의 고유 ID
        email = user_info.get("email")
        name = user_info.get("name")
        picture = user_info.get("picture")

        if not email:
            raise HTTPException(status_code=400, detail="이메일 정보를 가져올 수 없습니다")

        # --- 유저 조회 or 신규 생성 ---
        user = db.query(User).filter(User.email == email).first()

        if not user:
            user = User(
                email=email,
                name=name or "Google 사용자",
                status="ACTIVE",
                # profile_image_url=picture  # 필요 시 활성화
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"[INFO] 신규 구글 유저 생성: {email}")


        provider = db.query(AuthProvider).filter(AuthProvider.name == "GOOGLE").first()
        if not provider:
            raise HTTPException(status_code=404, detail="GOOGLE provider 설정이 없습니다")
        
        from app.models import AuthInfo  # 안전하게 import

        auth_info = (
            db.query(AuthInfo)
            .filter(
                AuthInfo.user_id == user.id,
                AuthInfo.provider_id == provider.id,
            )
            .first()
        )

        if not auth_info:
            auth_info = AuthInfo(
                user_id=user.id,
                provider_id=provider.id,
                external_user_id=external_user_id,
                access_token=access_token,
                refresh_token=refresh_token,
                scope="openid email profile",
                expires_at=expires_at,
            )
            db.add(auth_info)
        else:
            # 이미 있으면 갱신
            auth_info.access_token = access_token
            auth_info.refresh_token = refresh_token or auth_info.refresh_token
            auth_info.expires_at = expires_at
            auth_info.linked_at = datetime.utcnow()

        db.commit()

        # --- JWT 토큰 발급 ---
        jwt_token = create_access_token(subject=str(user.id))

        # return JSONResponse(content={"token": jwt_token})
        # URL 파라미터로 토큰 전달 (크로스 도메인 문제 해결)
        
        redirect_url = f"https://amori.co.kr/dashboard?token={jwt_token}"
        print(f"[DEBUG] 리다이렉트 URL: {redirect_url}")
        print(f"[DEBUG] JWT 토큰 길이: {len(jwt_token)}")
        return RedirectResponse(url=redirect_url)

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] 구글 로그인 오류: {e}")
        error_url = "https://amori.co.kr/login?error=oauth_failed"
        return RedirectResponse(url=error_url)
    