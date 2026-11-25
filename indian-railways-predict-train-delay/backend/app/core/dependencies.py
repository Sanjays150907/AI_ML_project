from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Extracts and authenticates user from Bearer header or session cookie.
    Rejects inactive or disabled accounts.
    """
    auth_token = token
    if not auth_token:
        # Check cookie fallback
        auth_token = request.cookies.get("access_token")
        if auth_token and auth_token.startswith("Bearer "):
            auth_token = auth_token[7:]

    if not auth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(auth_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing subject identifier"
        )

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identifier format"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with this session no longer exists"
        )

    if not user.is_active:
        reason = f": {user.disabled_reason}" if user.disabled_reason else ""
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your account has been deactivated by an administrator{reason}"
        )

    return user

def require_user(current_user: User = Depends(get_current_user)) -> User:
    """Enforces that the user is an active authenticated user."""
    return current_user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Enforces that the user has the 'admin' role."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Administrator privileges required"
        )
    return current_user
