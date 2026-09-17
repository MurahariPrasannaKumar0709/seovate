from fastapi import APIRouter

from app.mock_data.store import GBP_POSTS, GBP_REVIEWS

router = APIRouter()


@router.get("")
def get_gbp_activity():
    return {"posts": GBP_POSTS, "reviews": GBP_REVIEWS}
