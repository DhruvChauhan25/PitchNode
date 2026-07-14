import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

_client: Groq | None = None


def get_groq() -> Groq:
    global _client
    if _client is None:
        key = os.environ.get("GROQ_API_KEY")
        if not key:
            raise RuntimeError("GROQ_API_KEY not set in .env")
        _client = Groq(api_key=key)
    return _client



DIMENSION_MAP = {
    # Technical
    "problem_understanding": "problemSolving",
    "approach_reasoning": "problemSolving",
    "technical_correctness": "technicalAccuracy",
    "edge_case_awareness": "technicalAccuracy",
    # Behavioral
    "situation": "communication",
    "action": "problemSolving",
    "result": "technicalAccuracy",
    # HR
    "role_relevance": "technicalAccuracy",
    "authenticity": "confidence",
    "professionalism": "communication",
    "clarity": "communication",
    # Shared
    "communication": "communication",
}


def score_answer(
    question_text: str,
    transcript: str,
    interview_type: str,
    rubric_dimensions: list[dict],
) -> dict:
    """
    Sends the transcript to Groq with a rubric-locked prompt.
    Returns the fixed 4-key scores shape + feedback string.

    rubric_dimensions: list of {dimension_key, dimension_label, description}
    fetched from the rubrics table for this interview_type.
    """
    groq = get_groq()

    rubric_text = "\n".join(
        f"- {d['dimension_label']} ({d['dimension_key']}): {d['description']}"
        for d in rubric_dimensions
    )

    prompt = f"""You are an expert interview coach evaluating a candidate's spoken answer.

Interview type: {interview_type.upper()}
Question asked: {question_text}

Candidate's transcribed answer:
\"\"\"{transcript}\"\"\"

Score the answer on EACH of the following rubric dimensions. Give a score from 0–100 for each dimension, and base your scores strictly on the rubric descriptions — not on general impression.

Rubric dimensions:
{rubric_text}

Then write a single brief feedback sentence (max 2 sentences) identifying the strongest point and one specific improvement.

Respond ONLY with valid JSON in this exact format, no preamble, no markdown:
{{
  "dimension_scores": {{
    "<dimension_key>": <0-100>,
    ...
  }},
  "feedback": "<brief feedback string>"
}}"""

    response = groq.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,      # low temperature = consistent, less creative scoring
        max_tokens=500,
    )

    raw = response.choices[0].message.content.strip()

    
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    parsed = json.loads(raw)
    dimension_scores: dict = parsed.get("dimension_scores", {})
    feedback: str = parsed.get("feedback", "")

    
    buckets: dict[str, list[float]] = {
        "communication": [],
        "technicalAccuracy": [],
        "confidence": [],
        "problemSolving": [],
    }

    for dim_key, score in dimension_scores.items():
        frontend_key = DIMENSION_MAP.get(dim_key)
        if frontend_key:
            buckets[frontend_key].append(float(score))


    all_scores = [s for v in buckets.values() for s in v]
    if not buckets["confidence"] and all_scores:
        buckets["confidence"].append(round(sum(all_scores) / len(all_scores), 1))

    final_scores = {
        k: round(sum(v) / len(v), 1) if v else 0.0
        for k, v in buckets.items()
    }

    return {
        "scores": final_scores,
        "dimension_scores": dimension_scores,   
        "feedback": feedback,
    }
