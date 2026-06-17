-- Interview sessions
create table if not exists sessions (
    id uuid primary key default gen_random_uuid(),
    interview_type text not null check (interview_type in ('technical', 'hr', 'behavioral')),
    status text not null default 'created' check (status in ('created', 'in_progress', 'completed')),
    created_at timestamptz not null default now(),
    completed_at timestamptz
);

-- Question bank, seeded per interview type
create table if not exists questions (
    id uuid primary key default gen_random_uuid(),
    interview_type text not null check (interview_type in ('technical', 'hr', 'behavioral')),
    prompt text not null,
    "order" integer not null default 0,
    created_at timestamptz not null default now()
);

-- Rubric dimensions per interview type the structured methodology
-- (STAR for behavioral, rubric-based for technical/HR) that scoring
create table if not exists rubrics (
    id uuid primary key default gen_random_uuid(),
    interview_type text not null check (interview_type in ('technical', 'hr', 'behavioral')),
    dimension_key text not null,        
    dimension_label text not null,      
    description text not null,          
    "order" integer not null default 0,
    created_at timestamptz not null default now(),
    unique (interview_type, dimension_key)
);

-- One row per answered question within a session
create table if not exists evaluations (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references sessions(id) on delete cascade,
    question_id uuid references questions(id),
    transcript text,
    rubric_scores jsonb,        
    overall_score numeric,
    strengths text[],
    improvements text[],
    created_at timestamptz not null default now()
);

create index if not exists idx_evaluations_session_id on evaluations(session_id);


-- Technical: candidate SPEAKS their answer 
-- "Correctness" here means the explanation is factually/conceptually
-- accurate, judged by the LLM against the question, not by running code.
insert into rubrics (interview_type, dimension_key, dimension_label, description, "order") values
('technical', 'problem_understanding', 'Problem Understanding', 'Did the candidate correctly interpret what the question was asking before answering?', 1),
('technical', 'approach_reasoning', 'Approach & Reasoning', 'Did the candidate verbally explain a logical method, algorithm, or strategy?', 2),
('technical', 'technical_correctness', 'Technical Correctness', 'Is the content of the spoken answer factually and conceptually accurate, with no errors?', 3),
('technical', 'edge_case_awareness', 'Edge Case Awareness', 'Did the candidate mention boundary conditions, failure modes, or exceptions verbally?', 4),
('technical', 'communication', 'Communication', 'Was the explanation clear, structured, and easy to follow when spoken aloud?', 5)
on conflict (interview_type, dimension_key) do nothing;

-- Behavioral: scored against the STAR method.
insert into rubrics (interview_type, dimension_key, dimension_label, description, "order") values
('behavioral', 'situation', 'Situation', 'Did the candidate clearly set the context/background for the story?', 1),
('behavioral', 'action', 'Action (Task)', 'Did the candidate describe specific actions they personally took, not just the team?', 2),
('behavioral', 'result', 'Result', 'Did the candidate share a measurable or concrete outcome of their actions?', 3),
('behavioral', 'communication', 'Communication', 'Was the story told in a structured, concise way that was easy to follow?', 4)
on conflict (interview_type, dimension_key) do nothing;

-- HR: judged on fit, authenticity, and professionalism rather than STAR or technical accuracy.
insert into rubrics (interview_type, dimension_key, dimension_label, description, "order") values
('hr', 'role_relevance', 'Relevance to Role/Company', 'Did the candidate connect their answer specifically to this role or company, rather than giving a generic answer?', 1),
('hr', 'authenticity', 'Authenticity', 'Does the answer sound genuine and personal rather than rehearsed or generic?', 2),
('hr', 'professionalism', 'Professionalism', 'Did the candidate avoid oversharing, negativity about past employers, or red-flag statements?', 3),
('hr', 'clarity', 'Clarity & Conciseness', 'Was the answer clear and reasonably concise, without rambling?', 4)
on conflict (interview_type, dimension_key) do nothing;
