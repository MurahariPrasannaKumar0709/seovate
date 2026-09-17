from fastapi import APIRouter

from app.mock_data.store import ACTIVITY_TIMELINE, CUSTOMER

router = APIRouter()


@router.get("")
def get_activity():
    return {"customer": CUSTOMER, "timeline": ACTIVITY_TIMELINE}
