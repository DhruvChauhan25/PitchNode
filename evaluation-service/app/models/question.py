from pydantic import BaseModel
from typing import Literal


class QuestionResponse(BaseModel):
    id: str
    interview_type: str
    prompt: str
    order: int
    question_number: int    
    total_questions: int    
    is_last: bool           


class SessionCompleteResponse(BaseModel):
    session_id: str
    message: str            
