from fastapi import APIRouter

from app.schemas.guardrails import GuardrailResponse, PublishResponse
from app.services.guardrails import Draft, run_guardrail_checks, all_checks_passed

router = APIRouter()

SAMPLE_DRAFT = Draft(
    title='"Water Heater Repair in Frisco, TX" — new service page',
    meta_description=(
        "Fast, licensed water heater repair in Frisco, TX. Same-day service, "
        "upfront pricing, and a 12-month workmanship guarantee on every repair."
    ),
    body=" ".join(["word"] * 640),
    keyword="water heater repair frisco tx",
    existing_pages=[f"existing page {i} about plumbing services in Frisco" for i in range(41)],
)

_publish_state = {"published": False}


@router.get("", response_model=GuardrailResponse)
def get_guardrail_check():
    results = run_guardrail_checks(SAMPLE_DRAFT)
    return GuardrailResponse(
        draft={
            "generated_at": "09:14",
            "title": SAMPLE_DRAFT.title,
            "meta": f'Targeting "{SAMPLE_DRAFT.keyword}" · {len(SAMPLE_DRAFT.body.split())} words',
            "status": "Published" if _publish_state["published"] else "In review",
        },
        checks=[
            {"title": r.title, "detail": r.detail, "passed": r.passed, "result": "PASS" if r.passed else "FAIL"}
            for r in results
        ],
        all_passed=all_checks_passed(results),
        weekly_cap_used=1,
        weekly_cap_total=3,
    )


@router.post("/publish", response_model=PublishResponse)
def publish_draft():
    results = run_guardrail_checks(SAMPLE_DRAFT)
    if not all_checks_passed(results):
        return PublishResponse(published=False, message="One or more guardrail checks failed.")
    _publish_state["published"] = True
    return PublishResponse(published=True, message="Draft published automatically.")
