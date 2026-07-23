from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: Literal["user", "expert_applicant"] = "user"


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    verified: bool
    headline: Optional[str] = None
    expertise: Optional[list[str]] = []
    created_at: Optional[datetime] = None


class AuthResponse(BaseModel):
    user: UserProfile
    access_token: str
    refresh_token: str


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    headline: Optional[str] = None
    expertise: Optional[list[str]] = None
