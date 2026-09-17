from fastapi import APIRouter

from app.mock_data.store import OPPORTUNITIES

router = APIRouter()


@router.get("")
def get_opportunities():
    return {"opportunities": OPPORTUNITIES}
