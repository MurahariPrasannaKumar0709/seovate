from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    audit,
    activity,
    pipeline,
    opportunities,
    guardrails,
    gbp,
    github,
    integrations,
    onboarding,
)

app = FastAPI(title="Seovate API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(audit.router, prefix="/api/audit", tags=["audit"])
app.include_router(activity.router, prefix="/api/activity", tags=["activity"])
app.include_router(pipeline.router, prefix="/api/pipeline", tags=["pipeline"])
app.include_router(opportunities.router, prefix="/api/opportunities", tags=["opportunities"])
app.include_router(guardrails.router, prefix="/api/guardrails", tags=["guardrails"])
app.include_router(gbp.router, prefix="/api/gbp", tags=["gbp"])
app.include_router(github.router, prefix="/api/github", tags=["github"])
app.include_router(integrations.router, prefix="/api/integrations", tags=["integrations"])
app.include_router(onboarding.router, prefix="/api/onboarding", tags=["onboarding"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
