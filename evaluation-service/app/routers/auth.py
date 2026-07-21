from fastapi import APIRouter, HTTPException, Depends
from app.models.auth import (
    RegisterRequest, LoginRequest, AuthResponse,
    UserProfile, ProfileUpdateRequest
)
from app.db.supabase_client import get_supabase
from app.db.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


def _build_profile(profile: dict) -> UserProfile:
    return UserProfile(
        id=profile["id"],
        email=profile["email"],
        full_name=profile["full_name"],
        role=profile["role"],
        verified=profile.get("verified", False),
        headline=profile.get("headline"),
        expertise=profile.get("expertise") or [],
        created_at=profile.get("created_at"),
    )


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(payload: RegisterRequest):
    """
    Creates a Supabase Auth user and a file row
    """
    supabase = get_supabase()

    try:
        auth_response = supabase.auth.sign_up({
            "email": payload.email,
            "password": payload.password,
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not auth_response.user:
        raise HTTPException(status_code=400, detail="Registration failed")

    user_id = auth_response.user.id

    profile_data = {
        "id": user_id,
        "email": payload.email,
        "full_name": payload.full_name,
        "role": payload.role,
        "verified": False,
    }

    try:
        supabase.table("profiles").insert(profile_data).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile creation failed: {str(e)}")

    profile = _build_profile(profile_data)

    return AuthResponse(
        user=profile,
        access_token=auth_response.session.access_token if auth_response.session else "",
        refresh_token=auth_response.session.refresh_token if auth_response.session else "",
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest):
    """Authenticates user and returns JWT tokens."""
    supabase = get_supabase()

    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password,
        })
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not auth_response.user or not auth_response.session:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = auth_response.user.id

    profile_result = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if not profile_result.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile = _build_profile(profile_result.data[0])

    return AuthResponse(
        user=profile,
        access_token=auth_response.session.access_token,
        refresh_token=auth_response.session.refresh_token,
    )


@router.post("/logout", status_code=204)
def logout(current_user: dict = Depends(get_current_user)):
    """Signs out the current user (invalidates session server-side)."""
    supabase = get_supabase()
    try:
        supabase.auth.sign_out()
    except Exception:
        pass  
    return None


@router.get("/me", response_model=UserProfile)
def get_me(current_user: dict = Depends(get_current_user)):
    """Returns the current user's profile, read from JWT + DB."""
    supabase = get_supabase()
    user_id = current_user["sub"]

    profile_result = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if not profile_result.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    return _build_profile(profile_result.data[0])


@router.patch("/me", response_model=UserProfile)
def update_me(
    payload: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase()
    user_id = current_user["sub"]

    updates = payload.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = supabase.table("profiles").update(updates).eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    return _build_profile(result.data[0])
