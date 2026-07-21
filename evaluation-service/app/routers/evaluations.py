from fastapi import APIRouter, HTTPException
from app.models.evaluation import EvaluationRequest, EvaluationResponse
from app.db.supabase_client import get_supabase
from app.services.scoring import score_answer

router = APIRouter(prefix="/evaluations", tags=["evaluations"])


@router.post("", response_model=EvaluationResponse)
def evaluate_answer(payload: EvaluationRequest):
    """
    Scores one spoken answer using Groq + rubric methodology.
    Steps:
      1. Fetch rubric dimensions for this session's interview_type
      2. Send transcript + rubric to Groq → get dimension scores + feedback
      3. Persist evaluation row to DB
      4. Return the fixed 4-key scores shape the frontend expects
    """
    supabase = get_supabase()

    # 1. Get interview type from session
    session_result = (
        supabase.table("sessions")
        .select("interview_type")
        .eq("id", payload.session_id)
        .execute()
    )
    if not session_result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    interview_type = session_result.data[0]["interview_type"]

    # 2. Fetch rubric dimensions for this interview type
    rubric_result = (
        supabase.table("rubrics")
        .select("dimension_key, dimension_label, description")
        .eq("interview_type", interview_type)
        .order("order")
        .execute()
    )
    if not rubric_result.data:
        raise HTTPException(status_code=500, detail=f"No rubric found for type: {interview_type}")

    # 3. Score using Groq
    try:
        result = score_answer(
            question_text=payload.question_text,
            transcript=payload.transcript,
            interview_type=interview_type,
            rubric_dimensions=rubric_result.data,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring failed: {str(e)}")

    scores = result["scores"]
    overall = round(sum(scores.values()) / len(scores), 1)

    # 4. Persist to evaluations table
    supabase.table("evaluations").insert({
        "session_id": payload.session_id,
        "question_id": payload.question_id,
        "transcript": payload.transcript,
        "rubric_scores": result["scores"],         
        "dimension_scores": result["dimension_scores"],  
        "overall_score": overall,
        "feedback": result["feedback"],
    }).execute()

    # 5. Mark question as answered in session_questions
    supabase.table("session_questions").update({"answered": True}).eq(
        "session_id", payload.session_id
    ).eq("question_id", payload.question_id).execute()

    return {
        "scores": scores,
        "feedback": result["feedback"],
    }
