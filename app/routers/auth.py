"""
Authentication routes: Signup and Login
"""
from fastapi import APIRouter, Depends, HTTPException, status, Form  # , UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional

from app.database import get_db
from app.models import User, UserCredential
from app.schemas import SignupRequest, SignupResponse, LoginRequest, LoginResponse, UserResponse  # , ImageUploadResponse
from app.security import hash_password, verify_password, create_access_token, JWT_SECRET_KEY
# from app.gcs_utils import upload_image_to_gcs

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    email: str = Form(...),
    name: str = Form(...),
    password: str = Form(...),
    phone: Optional[str] = Form(None),
    # profile_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    회원가입 엔드포인트
    - 이메일 중복 체크
    - 비밀번호 해싱 후 저장
    # - 프로필 이미지 GCS 업로드 (옵션)
    """
    
    # 이메일 중복 체크
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 등록된 이메일입니다."
        )
    
    # 프로필 이미지 업로드 처리 (임시 비활성화)
    profile_image_url = None
    # if profile_image:
    #     try:
    #         file_bytes = await profile_image.read()
    #         profile_image_url = upload_image_to_gcs(
    #             file_bytes, 
    #             profile_image.filename, 
    #             profile_image.content_type
    #         )
    #     except Exception as e:
    #         raise HTTPException(
    #             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    #             detail=f"이미지 업로드 실패: {str(e)}"
    #         )
    
    # User 생성
    new_user = User(
        email=email,
        name=name,
        phone=phone,
        # profile_image_url=profile_image_url,
        status="ACTIVE"
    )
    db.add(new_user)
    db.flush()  # user.id 생성을 위해 flush
    
    # UserCredential 생성 (비밀번호 해싱)
    password_hash = hash_password(password)
    new_credential = UserCredential(
        user_id=new_user.id,
        password_hash=password_hash,
        last_password_change=datetime.utcnow(),
        login_attempts=0
    )
    db.add(new_credential)
    db.commit()
    db.refresh(new_user)
    
    return SignupResponse(
        id=new_user.id,
        email=new_user.email,
        name=new_user.name
    )


@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    로그인 엔드포인트
    - 이메일/비밀번호 검증
    - JWT 토큰 발급
    - 로그인 시도 횟수 관리
    """
    
    # 사용자 조회
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다."
        )
    
    # 계정 상태 확인
    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="계정이 비활성화 상태입니다."
        )
    
    # Credential 조회
    credential = db.query(UserCredential).filter(UserCredential.user_id == user.id).first()
    if not credential:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다."
        )
    
    # 계정 잠금 확인
    if credential.locked_until and credential.locked_until > datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="계정이 일시적으로 잠겼습니다. 나중에 다시 시도해주세요."
        )
    
    # 비밀번호 검증
    if not verify_password(login_data.password, credential.password_hash):
        # 로그인 실패 시도 증가
        credential.login_attempts += 1
        if credential.login_attempts >= 5:
            credential.locked_until = datetime.utcnow() + timedelta(minutes=30)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다."
        )
    
    # 로그인 성공: 로그인 시도 횟수 초기화
    credential.login_attempts = 0
    credential.locked_until = None
    db.commit()
    
    # JWT 토큰 생성 (subject에 user ID 저장)
    print("[INFO] Login JWT_SECRET_KEY: ", JWT_SECRET_KEY)
    access_token = create_access_token(subject=str(user.id))
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )


# @router.post("/upload-image", response_model=ImageUploadResponse)
# async def upload_profile_image(
#     image: UploadFile = File(...),
# ):
#     """
#     프로필 이미지 업로드 전용 엔드포인트
#     회원가입과 별도로 이미지만 먼저 업로드할 때 사용
#     """
#     try:
#         file_bytes = await image.read()
#         image_url = upload_image_to_gcs(
#             file_bytes, 
#             image.filename, 
#             image.content_type
#         )
#         return ImageUploadResponse(url=image_url)
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"이미지 업로드 실패: {str(e)}"
#         )
