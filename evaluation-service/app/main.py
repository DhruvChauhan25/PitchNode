from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from app.routers import session, rubric, questions, evaluations, auth

security = HTTPBearer()

app = FastAPI(
    title="PitchNode Backend",
    version="0.4.0",
    swagger_ui_parameters={"persistAuthorization": True},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(session.router)
app.include_router(rubric.router)
app.include_router(questions.router)
app.include_router(evaluations.router)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "pitchnode-backend", "version": "0.4.0"}
