import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime.datetime
    last_login_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
