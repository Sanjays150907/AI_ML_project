import datetime
from typing import Any, Optional
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHash
from app.core.config import settings

# Initialize Argon2 password hasher
ph = PasswordHasher(
    time_cost=2,
    memory_cost=19456,  # 19 MiB
    parallelism=1,
    hash_len=32,
    salt_len=16
)

def hash_password(password: str) -> str:
    """Hashes a password using Argon2id."""
    return ph.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored Argon2id hash."""
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHash):
        return False

def create_access_token(subject: str, role: str, expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Creates a signed JWT access token."""
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {
        "sub": str(subject),
        "role": role,
        "exp": expire,
        "iat": datetime.datetime.now(datetime.timezone.utc)
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    """Decodes and validates a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None
