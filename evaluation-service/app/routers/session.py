from fastapi import APIRouter, HTTPException
from app.models.session import (
    SessionCreateRequest, SessionResponse,
    SessionHistoryResponse, SessionHistoryItem
)
from app.db.supabase_client import get_supabase

router = APIRouter(prefix="/session", tags=["session"])


@router.post("/start", response_model=SessionResponse, status_code=201)
def start_session(payload: SessionCreateRequest):
    """
    Creates a new interview session. Accepts user_id (required),
    difficulty, duration, job_description, cv_text (optional).
    Returns 201 with the full session object.
    """
    supabase = get_supabase()

    result = (
        supabase.table("sessions")
        .insert({
            "interview_type": payload.interview_type,
            "user_id": payload.user_id,
            "difficulty": payload.difficulty,
            "duration": payload.duration,
            "job_description": payload.job_description,
            "cv_text": payload.cv_text,
            "status": "created",
        })
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create session")

    return result.data[0]


@router.get("/history", response_model=SessionHistoryResponse)
def get_session_history(user_id: str):
    supabase = get_supabase()

    result = (
        supabase.table("sessions")
        .select("id, interview_type, difficulty, overall_score, status, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )

    return {"sessions": result.data}


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: str):
    """Fetch a single session by ID."""
    supabase = get_supabase()

    result = supabase.table("sessions").select("*").eq("id", session_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    return result.data[0]


@router.post("/{session_id}/complete")
def complete_session(session_id: str):
    """
    Marks the session complete and computes the overall score
    as the average of all evaluation scores for this session.
    """
    supabase = get_supabase()

    # Fetch all evaluations for particular session
    evals = (
        supabase.table("evaluations")
        .select("overall_score")
        .eq("session_id", session_id)
        .execute()
    )

    scores = [e["overall_score"] for e in evals.data if e.get("overall_score") is not None]
    overall = round(sum(scores) / len(scores), 1) if scores else None

    # Mark session complete and store overall score
    supabase.table("sessions").update({
        "status": "completed",
        "overall_score": overall,
    }).eq("id", session_id).execute()

    return {"ok": True, "overall_score": overall}


@router.get("/{session_id}/results")
def get_session_results(session_id: str):
    supabase = get_supabase()

    # Fetch session
    session_result = supabase.table("sessions").select("*").eq("id", session_id).execute()
    if not session_result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    session = session_result.data[0]

    evals = (
        supabase.table("evaluations")
        .select("*, questions(prompt)")
        .eq("session_id", session_id)
        .order("created_at")
        .execute()
    )

    per_question = []
    all_scores: dict[str, list[float]] = {
        "communication": [],
        "technicalAccuracy": [],
        "confidence": [],
        "problemSolving": [],
    }

    for e in evals.data:
        scores = e.get("rubric_scores") or {}
        per_question.append({
            "question_id": e["question_id"],
            "question_text": e["questions"]["prompt"] if e.get("questions") else "",
            "scores": scores,
            "feedback": e.get("feedback", ""),
        })
        for key in all_scores:
            if key in scores:
                all_scores[key].append(scores[key])

    avg_scores = {
        k: round(sum(v) / len(v), 1) if v else 0
        for k, v in all_scores.items()
    }

    # Derive strengths top 2 and weaknesses bottom 1
    sorted_dims = sorted(avg_scores.items(), key=lambda x: x[1], reverse=True)
    strengths = [d[0] for d in sorted_dims[:2] if d[1] > 0]
    weaknesses = [d[0] for d in sorted_dims[-1:] if d[1] > 0]

    recommendations = {
        "communication": "Practice structuring your answers clearly before speaking.",
        "technicalAccuracy": "Review core concepts and practice explaining them out loud.",
        "confidence": "Work on pacing, reduce filler words, and pause deliberately.",
        "problemSolving": "Walk through your reasoning step by step before jumping to answers.",
    }
    weakest = sorted_dims[-1][0] if sorted_dims else None
    recommendation = recommendations.get(weakest, "Keep practicing across all dimensions.")

    return {
        "session_id": session_id,
        "overall_score": session.get("overall_score"),
        "per_question": per_question,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendation": recommendation,
    }
