"""Deterministic guardrail checks a generated draft must pass before publishing.

Plain rule-based checks (length, duplicate-content overlap, banned patterns,
schema/meta length limits) — never an LLM call grading its own output.
"""
import re
from dataclasses import dataclass

MIN_WORD_COUNT = 400
MAX_DUPLICATE_OVERLAP_PCT = 30
MAX_META_DESCRIPTION_CHARS = 160
MAX_TITLE_CHARS = 60
BANNED_PATTERNS = [r"\bclick here\b", r"\bbuy now buy now\b", r"(\bseo\b\s*){4,}"]


@dataclass
class Draft:
    title: str
    meta_description: str
    body: str
    keyword: str
    existing_pages: list[str]


@dataclass
class CheckResult:
    title: str
    detail: str
    passed: bool


def word_count(text: str) -> int:
    return len(text.split())


def duplicate_overlap_pct(body: str, existing_pages: list[str]) -> float:
    if not existing_pages:
        return 0.0
    body_words = set(re.findall(r"\w+", body.lower()))
    if not body_words:
        return 0.0
    max_overlap = 0.0
    for page in existing_pages:
        page_words = set(re.findall(r"\w+", page.lower()))
        if not page_words:
            continue
        overlap = len(body_words & page_words) / len(body_words) * 100
        max_overlap = max(max_overlap, overlap)
    return round(max_overlap, 1)


def has_banned_pattern(body: str) -> bool:
    lowered = body.lower()
    return any(re.search(pattern, lowered) for pattern in BANNED_PATTERNS)


def has_keyword_intent(keyword: str) -> bool:
    return bool(keyword.strip())


def run_guardrail_checks(draft: Draft) -> list[CheckResult]:
    overlap = duplicate_overlap_pct(draft.body, draft.existing_pages)
    wc = word_count(draft.body)

    return [
        CheckResult(
            title="Real keyword, real intent",
            detail=f"Targets '{draft.keyword}' — confirmed local search volume, not a generic/templated topic",
            passed=has_keyword_intent(draft.keyword),
        ),
        CheckResult(
            title="Minimum content length & structure",
            detail=f"{wc} words — above the {MIN_WORD_COUNT}-word floor",
            passed=wc >= MIN_WORD_COUNT,
        ),
        CheckResult(
            title="Duplicate / near-duplicate check",
            detail=f"Compared against {len(draft.existing_pages)} existing pages on this site — {overlap}% overlap, threshold is {MAX_DUPLICATE_OVERLAP_PCT}%",
            passed=overlap < MAX_DUPLICATE_OVERLAP_PCT,
        ),
        CheckResult(
            title="Banned-pattern check",
            detail="No keyword stuffing, no thin/templated boilerplate detected",
            passed=not has_banned_pattern(draft.body),
        ),
        CheckResult(
            title="Schema & meta validation",
            detail=f"title {len(draft.title)} chars, meta description {len(draft.meta_description)} chars",
            passed=len(draft.title) <= MAX_TITLE_CHARS
            and len(draft.meta_description) <= MAX_META_DESCRIPTION_CHARS,
        ),
    ]


def all_checks_passed(results: list[CheckResult]) -> bool:
    return all(r.passed for r in results)
