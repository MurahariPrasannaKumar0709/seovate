from fastapi import APIRouter

from app.mock_data.store import PIPELINE_RUNS, PIPELINE_STAGES

router = APIRouter()


@router.get("")
def get_pipeline():
    return {"stages": PIPELINE_STAGES, "runs": PIPELINE_RUNS}
