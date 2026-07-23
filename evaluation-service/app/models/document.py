from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CVResponse(BaseModel):
    id: str
    file_name: str
    size: int
    uploaded_at: datetime
    parsed: bool


class CVListItem(BaseModel):
    id: str
    file_name: str
    uploaded_at: datetime
    is_default: bool


class CVListResponse(BaseModel):
    cvs: list[CVListItem]


class SignedUrlResponse(BaseModel):
    url: str
    expires_in: int


class JDCreateRequest(BaseModel):
    title: str
    company: str
    text: str


class JDResponse(BaseModel):
    id: str
    title: str
    company: str
    created_at: datetime


class JDDetailResponse(BaseModel):
    id: str
    title: str
    company: str
    text: str
    created_at: datetime


class JDListResponse(BaseModel):
    job_descriptions: list[JDResponse]


class JDPreset(BaseModel):
    id: str
    title: str
    company: str
    summary: str


class JDPresetsResponse(BaseModel):
    presets: list[JDPreset]
