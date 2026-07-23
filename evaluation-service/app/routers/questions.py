from fastapi import APIRouter, HTTPException, Depends
from app.models.question import QuestionResponse
from app.db.supabase_client import get_supabase
from app.db.auth import get_current_user
from app.services.question_gen import generate_questions

router = APIRouter(prefix="/questions", tags=["questions"])

QUESTIONS_PER_SESSION = 5


@router.post("/generate", response_model=list[dict])
def generate_tailored_questions(
    interview_type: str,
    cv_id: str | None = None,
    jd_id: str | None = None,
    count: int = 5,
    current_user: dict = Depends(get_current_user)
):

    supabase = get_supabase()
    user_id = current_user["sub"]

    cv_text = None
    jd_text = None

    if cv_id:
        cv_result = supabase.table("cvs").select("cv_text").eq("id", cv_id).eq("user_id", user_id).execute()
        if cv_result.data:
            cv_text = cv_result.data[0].get("cv_text")

    if jd_id:
        jd_result = supabase.table("job_descriptions").select("text").eq("id", jd_id).execute()
        if jd_result.data:
            jd_text = jd_result.data[0].get("text")

    try:
        questions = generate_questions(
            interview_type=interview_type,
            cv_text=cv_text,
            jd_text=jd_text,
            count=count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")

    return questions


@router.post("/{session_id}/start", response_model=dict)
def start_session_questions(session_id: str, current_user: dict = Depends(get_current_user)):
    """Queues questions for the session in order. Call once when interview begins."""
    supabase = get_supabase()
    user_id = current_user["sub"]

    session_result = supabase.table("sessions").select("*").eq("id", session_id).execute()
    if not session_result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    session = session_result.data[0]
    if session["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Session not found")

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
        raise HTTPException(status_code=404, detail=f"No questions found for: {interview_type}")

    rows = [
        {"session_id": session_id, "question_id": q["id"], "question_order": idx + 1, "answered": False}
        for idx, q in enumerate(questions_result.data)
    ]
    supabase.table("session_questions").insert(rows).execute()
    supabase.table("sessions").update({"status": "in_progress"}).eq("id", session_id).execute()

    return {"message": "Session started", "session_id": session_id, "total_questions": len(rows)}


@router.get("/{session_id}/next", response_model=QuestionResponse)
def get_next_question(session_id: str, current_user: dict = Depends(get_current_user)):
    """Returns the next unanswered question for the session"""
    supabase = get_supabase()
    user_id = current_user["sub"]

    session_result = supabase.table("sessions").select("user_id").eq("id", session_id).execute()
    if not session_result.data or session_result.data[0]["user_id"] != user_id:
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
def mark_answered(session_id: str, question_id: str, current_user: dict = Depends(get_current_user)):
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
