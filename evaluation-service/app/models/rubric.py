from pydantic import BaseModel
from typing import Literal


class RubricDimension(BaseModel):
    id: str
    interview_type: str
    dimension_key: str
    dimension_label: str
    description: str
    order: int
