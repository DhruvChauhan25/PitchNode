from fastapi import APIRouter, HTTPException
from app.models.question import QuestionResponse, SessionCompleteResponse
from app.db.supabase_client import get_supabase

router = APIRouter(prefix="/questions", tags=["questions"])

QUESTIONS_PER_SESSION = 5


@router.post("/{session_id}/start", response_model=dict)
def start_session_questions(session_id: str):
    """
    Called once when the interview begins. Fetches all questions for
    this session's interview_type and queues them in session_questions,
    so the backend owns the order and progress tracking.
    """
    supabase = get_supabase()

    session_result = supabase.table("sessions").select("*").eq("id", session_id).execute()
    if not session_result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    session = session_result.data[0]
    interview_type = session["interview_type"]

    existing = supabase.table("session_questions").select("id").eq("session_id", session_id).execute()
    if existing.data:
        return {"message": "Session already started", "session_id": session_id}

    questions_result = (
        supabase.table("questions")
        .select("id, order")
        .eq("interview_type", interview_type)
        .order("order")
        .limit(QUESTIONS_PER_SESSION)
        .execute()
    )

    if not questions_result.data:
        raise HTTPException(status_code=404, detail=f"No questions found for interview type: {interview_type}")

    rows = [
        {
            "session_id": session_id,
            "question_id": q["id"],
            "question_order": idx + 1,
            "answered": False,
        }
        for idx, q in enumerate(questions_result.data)
    ]
    supabase.table("session_questions").insert(rows).execute()

    supabase.table("sessions").update({"status": "in_progress"}).eq("id", session_id).execute()

    return {"message": "Session started", "session_id": session_id, "total_questions": len(rows)}


@router.get("/{session_id}/next", response_model=QuestionResponse)
def get_next_question(session_id: str):
    """
    Returns the next unanswered question for this session.
    Returns 404 with a clear message if all questions are already answered.
    """
    supabase = get_supabase()

    session_result = supabase.table("sessions").select("id").eq("id", session_id).execute()
    if not session_result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    sq_result = (
        supabase.table("session_questions")
        .select("*, questions(id, interview_type, prompt, order)")
        .eq("session_id", session_id)
        .eq("answered", False)
        .order("question_order")
        .limit(1)
        .execute()
    )

    if not sq_result.data:
        raise HTTPException(status_code=404, detail="All questions answered. Call POST /session/{id}/complete.")

    sq = sq_result.data[0]
    question = sq["questions"]
    question_number = sq["question_order"]

    # Count total questions queued for this session
    total_result = (
        supabase.table("session_questions")
        .select("id", count="exact")
        .eq("session_id", session_id)
        .execute()
    )
    total = total_result.count or QUESTIONS_PER_SESSION

    return {
        "id": question["id"],
        "interview_type": question["interview_type"],
        "prompt": question["prompt"],
        "order": question["order"],
        "question_number": question_number,
        "total_questions": total,
        "is_last": question_number == total,
    }


@router.post("/{session_id}/answered/{question_id}", response_model=dict)
def mark_answered(session_id: str, question_id: str):
    """
    Marks a question as answered so the next call to /next advances forward.
    Call this after the candidate finishes speaking (before or after transcription).
    """
    supabase = get_supabase()

    result = (
        supabase.table("session_questions")
        .update({"answered": True})
        .eq("session_id", session_id)
        .eq("question_id", question_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Session/question combination not found")

    return {"message": "Question marked as answered", "question_id": question_id}
