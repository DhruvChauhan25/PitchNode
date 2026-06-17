from pydantic import BaseModel
from typing import Literal
from datetime import datetime


class SessionCreateRequest(BaseModel):
    interview_type: Literal["technical", "hr", "behavioral"]


class SessionResponse(BaseModel):
    id: str
    interview_type: str
    status: str
    created_at: datetime
