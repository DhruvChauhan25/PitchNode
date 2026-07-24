import io
import os
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from app.models.document import (
    CVResponse, CVListResponse, CVListItem, SignedUrlResponse,
    JDCreateRequest, JDResponse, JDDetailResponse, JDListResponse,
    JDPreset, JDPresetsResponse
)
from app.db.supabase_client import get_supabase
from app.db.auth import get_current_user

router = APIRouter(prefix="/documents", tags=["documents"])

CV_BUCKET = "cvs"
MAX_CV_SIZE = 5 * 1024 * 1024  

JD_PRESETS = [
    {"id": "jd_sde1", "title": "Software Engineer I", "company": "Generic Tech Co",
     "summary": "Backend services, REST APIs, system design fundamentals."},
    {"id": "jd_de1", "title": "Data Engineer", "company": "Generic Tech Co",
     "summary": "ETL pipelines, SQL, cloud data warehouses, Python scripting."},
    {"id": "jd_mle1", "title": "ML Engineer", "company": "Generic Tech Co",
     "summary": "Model training, deployment, MLOps, Python, PyTorch/TensorFlow."},
    {"id": "jd_ds1", "title": "Data Scientist", "company": "Generic Tech Co",
     "summary": "Statistical analysis, ML modeling, Python, stakeholder communication."},
    {"id": "jd_pm1", "title": "Product Manager", "company": "Generic Tech Co",
     "summary": "Roadmap planning, user research, cross-functional collaboration."},
]


def _extract_pdf_text(file_bytes: bytes) -> str:
    """Extract text from PDF bytes using PyPDF2"""
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text.strip()
    except Exception as e:
        print(f"[documents] PDF extraction failed: {e}")
        return ""


@router.post("/cv", response_model=CVResponse, status_code=201)
async def upload_cv(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["sub"]

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_CV_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 5MB limit")

    supabase = get_supabase()

    storage_path = f"{user_id}/{file.filename}"
    try:
        supabase.storage.from_(CV_BUCKET).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": "application/pdf", "upsert": "true"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    cv_text = _extract_pdf_text(file_bytes)

    result = supabase.table("cvs").insert({
        "user_id": user_id,
        "file_name": file.filename,
        "storage_path": storage_path,
        "size": len(file_bytes),
        "cv_text": cv_text,
        "parsed": bool(cv_text),
        "is_default": False,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save CV metadata")

    row = result.data[0]
    return CVResponse(
        id=row["id"],
        file_name=row["file_name"],
        size=row["size"],
        uploaded_at=row["created_at"],
        parsed=row["parsed"],
    )


@router.get("/cv", response_model=CVListResponse)
def list_cvs(current_user: dict = Depends(get_current_user)):
    """List all CVs uploaded by the current user"""
    supabase = get_supabase()
    user_id = current_user["sub"]
    result = (
        supabase.table("cvs")
        .select("id, file_name, created_at, is_default")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return CVListResponse(cvs=[
        CVListItem(
            id=r["id"],
            file_name=r["file_name"],
            uploaded_at=r["created_at"],
            is_default=r.get("is_default", False),
        ) for r in result.data
    ])


@router.get("/cv/{cv_id}/url", response_model=SignedUrlResponse)
def get_cv_url(cv_id: str, current_user: dict = Depends(get_current_user)):
    """Returns a signed, expiring download URL for a CV"""
    supabase = get_supabase()
    user_id = current_user["sub"]

    cv_result = supabase.table("cvs").select("*").eq("id", cv_id).eq("user_id", user_id).execute()
    if not cv_result.data:
        raise HTTPException(status_code=404, detail="CV not found")

    storage_path = cv_result.data[0]["storage_path"]
    try:
        signed = supabase.storage.from_(CV_BUCKET).create_signed_url(storage_path, expires_in=300)
        return SignedUrlResponse(url=signed["signedURL"], expires_in=300)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate signed URL: {str(e)}")


@router.delete("/cv/{cv_id}", status_code=204)
def delete_cv(cv_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a CV and its storage file."""
    supabase = get_supabase()
    user_id = current_user["sub"]

    cv_result = supabase.table("cvs").select("*").eq("id", cv_id).eq("user_id", user_id).execute()
    if not cv_result.data:
        raise HTTPException(status_code=404, detail="CV not found")

    storage_path = cv_result.data[0]["storage_path"]
    try:
        supabase.storage.from_(CV_BUCKET).remove([storage_path])
    except Exception:
        pass  # Don't fail if storage delete fails

    supabase.table("cvs").delete().eq("id", cv_id).execute()
    return None


@router.get("/jd/presets", response_model=JDPresetsResponse)
def get_jd_presets():
    supabase = get_supabase()
    result = (
        supabase.table("job_descriptions")
        .select("id, title, company, text")
        .is_("user_id", "null")
        .execute()
    )
    return JDPresetsResponse(presets=[
        JDPreset(
            id=row["id"],
            title = row["title"],
            company=row["company"],
            summary=(row.get("text") or "")[:160],
        ) 
        for row in (result.data or [])
    ])


@router.post("/jd", response_model=JDResponse, status_code=201)
def create_jd(payload: JDCreateRequest, current_user: dict = Depends(get_current_user)):
    """Create a job description"""
    supabase = get_supabase()
    user_id = current_user["sub"]
    result = supabase.table("job_descriptions").insert({
        "user_id": user_id,
        "title": payload.title,
        "company": payload.company,
        "text": payload.text,
    }).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create JD")
    row = result.data[0]
    return JDResponse(id=row["id"], title=row["title"], company=row["company"], created_at=row["created_at"])


@router.get("/jd", response_model=JDListResponse)
def list_jds(current_user: dict = Depends(get_current_user)):
    """List all JDs for the current user"""
    supabase = get_supabase()
    user_id = current_user["sub"]
    result = (
        supabase.table("job_descriptions")
        .select("id, title, company, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return JDListResponse(job_descriptions=[
        JDResponse(id=r["id"], title=r["title"], company=r["company"], created_at=r["created_at"])
        for r in result.data
    ])


@router.get("/jd/{jd_id}", response_model=JDDetailResponse)
def get_jd(jd_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single JD with full text."""
    supabase = get_supabase()
    user_id = current_user["sub"]
    result = supabase.table("job_descriptions").select("*").eq("id", jd_id).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Job description not found")
    r = result.data[0]
    return JDDetailResponse(id=r["id"], title=r["title"], company=r["company"], text=r["text"], created_at=r["created_at"])


@router.delete("/jd/{jd_id}", status_code=204)
def delete_jd(jd_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a JD"""
    supabase = get_supabase()
    user_id = current_user["sub"]
    result = supabase.table("job_descriptions").select("id").eq("id", jd_id).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Job description not found")
    supabase.table("job_descriptions").delete().eq("id", jd_id).execute()
    return None
