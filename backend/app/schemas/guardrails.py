from pydantic import BaseModel


class CheckResultSchema(BaseModel):
    title: str
    detail: str
    passed: bool
    result: str


class DraftSummarySchema(BaseModel):
    generated_at: str
    title: str
    meta: str
    status: str


class GuardrailResponse(BaseModel):
    draft: DraftSummarySchema
    checks: list[CheckResultSchema]
    all_passed: bool
    weekly_cap_used: int
    weekly_cap_total: int


class PublishResponse(BaseModel):
    published: bool
    message: str
