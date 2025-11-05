"""
Security utilities: password hashing and JWT handling.
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
import hashlib
from passlib.context import CryptContext
import os


# Password hashing context (pbkdf2_sha256만 사용, bcrypt 사용 안 함)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# JWT settings
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))


def hash_password(password: str) -> str:
    return pwd_context.hash(password)  # bcrypt가 직접 처리


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta is None:
        expires_delta = timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.utcnow() + expires_delta
    to_encode = {"sub": subject, "exp": expire}
    print(to_encode ,"<- to_encode in create_access_token")
    print(JWT_SECRET_KEY ,"<- JWT_SECRET_KEY in create_access_token")
    print(JWT_ALGORITHM ,"<- JWT_ALGORITHM in create_access_token") 
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
