from fastapi import APIRouter

from app.mock_data.store import AUDIT

router = APIRouter()


@router.get("")
def get_audit():
    return AUDIT
