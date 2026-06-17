from fastapi import APIRouter
from typing import Literal
from app.models.rubric import RubricDimension
from app.db.supabase_client import get_supabase

router = APIRouter(prefix="/rubric", tags=["rubric"])


@router.get("/{interview_type}", response_model=list[RubricDimension])
def get_rubric(interview_type: Literal["technical", "hr", "behavioral"]):
    """
    Returns the locked rubric dimensions for a given interview type,
    in display order. This is the methodology scoring prompts will be
    built not used for scoring yet, just exposed here
    so the structure can be verified/reused (e.g. by the frontend to
    show "what to be scored on").
    """
    supabase = get_supabase()

    result = (
        supabase.table("rubrics")
        .select("*")
        .eq("interview_type", interview_type)
        .order("order")
        .execute()
    )

    return result.data
