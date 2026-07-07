from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import session, rubric, questions

app = FastAPI(title="PitchNode Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(session.router)
app.include_router(rubric.router)
app.include_router(questions.router)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "pitchnode-backend"}
