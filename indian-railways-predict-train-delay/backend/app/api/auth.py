import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.models import User, AuditLog
from app.schemas.auth import UserRegister, UserLogin, UserResponse, UserUpdate, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(req: UserRegister, db: Session = Depends(get_db)):
    """
    Public registration endpoint.
    Strictly assigns the 'user' role. Never allows visitor to acquire 'admin'.
    """
    email_clean = req.email.lower().strip()
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )

    new_user = User(
        email=email_clean,
        password_hash=hash_password(req.password),
        full_name=req.full_name,
        role="user", # Strictly forced to 'user'
        is_active=True,
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Log registration
    audit = AuditLog(
        user_id=new_user.id,
        action="USER_REGISTRATION",
        endpoint="/api/auth/register",
        status_code=201
    )
    db.add(audit)
    db.commit()

    return new_user

@router.post("/login", response_model=Token)
def login_user(req: UserLogin, response: Response, db: Session = Depends(get_db)):
    """
    Authenticates user, sets HttpOnly cookie and returns Bearer token.
    """
    email_clean = req.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()
    
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        reason = f": {user.disabled_reason}" if user.disabled_reason else ""
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This account has been deactivated{reason}"
        )

    # Update last login
    user.last_login_at = datetime.datetime.utcnow()
    db.commit()

    # Generate JWT
    token = create_access_token(subject=str(user.id), role=user.role)

    # Set secure cookie
    response.set_cookie(
        key="access_token",
        value=f"Bearer {token}",
        httponly=True,
        max_age=86400,
        samesite="lax",
        secure=False # Set to True in HTTPS production
    )

    # Audit log
    audit = AuditLog(
        user_id=user.id,
        action="USER_LOGIN",
        endpoint="/api/auth/login",
        status_code=200
    )
    db.add(audit)
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/logout")
def logout_user(response: Response, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Clears session cookie and logs user logout.
    """
    response.delete_cookie("access_token")
    audit = AuditLog(
        user_id=current_user.id,
        action="USER_LOGOUT",
        endpoint="/api/auth/logout",
        status_code=200
    )
    db.add(audit)
    db.commit()
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user's profile."""
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(
    req: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allows user to update their name or password."""
    if req.full_name is not None:
        current_user.full_name = req.full_name
    if req.password:
        current_user.password_hash = hash_password(req.password)

    db.commit()
    db.refresh(current_user)

    audit = AuditLog(
        user_id=current_user.id,
        action="PROFILE_UPDATED",
        endpoint="/api/auth/profile",
        status_code=200
    )
    db.add(audit)
    db.commit()

    return current_user
