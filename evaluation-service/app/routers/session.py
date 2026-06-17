from fastapi import APIRouter, HTTPException
from app.models.session import SessionCreateRequest, SessionResponse
from app.db.supabase_client import get_supabase

router = APIRouter(prefix="/session", tags=["session"])


@router.post("/start", response_model=SessionResponse)
def start_session(payload: SessionCreateRequest):
    """
    Creates a new interview session and returns its unique ID.
    This is the entry point the frontend calls when a user picks
    Technical / HR / Behavioral and clicks "Start".
    """
    supabase = get_supabase()

    result = (
        supabase.table("sessions")
        .insert({"interview_type": payload.interview_type, "status": "created"})
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create session")

    return result.data[0]


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: str):
    """Fetch a single session by ID."""
    supabase = get_supabase()

    result = supabase.table("sessions").select("*").eq("id", session_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    return result.data[0]
