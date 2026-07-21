from pydantic import BaseModel


class QuestionResponse(BaseModel):
    id: str
    interview_type: str
    prompt: str
    order: int
    question_number: int
    total_questions: int
    is_last: bool
