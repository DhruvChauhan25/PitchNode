from pydantic import BaseModel
from typing import Literal, Optional
from datetime import datetime


class SessionCreateRequest(BaseModel):
    interview_type: Literal["technical", "hr", "behavioral"]
    user_id: str                                        # required — professor's graded deliverable
    difficulty: Optional[Literal["easy", "medium", "hard"]] = "medium"
    duration: Optional[Literal[15, 30, 45]] = 30       # minutes
    job_description: Optional[str] = None
    cv_text: Optional[str] = None


class SessionResponse(BaseModel):
    id: str
    user_id: str
    interview_type: str
    difficulty: Optional[str]
    duration: Optional[int]
    status: str
    created_at: datetime


class SessionHistoryItem(BaseModel):
    id: str
    interview_type: str
    difficulty: Optional[str]
    overall_score: Optional[float]
    status: str
    created_at: datetime


class SessionHistoryResponse(BaseModel):
    sessions: list[SessionHistoryItem]
