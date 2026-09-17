from fastapi import APIRouter
from pydantic import BaseModel

from app.mock_data.store import INTEGRATIONS_SETTINGS
from app.services.domain_verification import build_txt_record

router = APIRouter()


class DomainRequest(BaseModel):
    url: str
    host: str = "Other"


@router.post("/dns-record")
def get_dns_record(payload: DomainRequest):
    return build_txt_record(payload.url)


@router.post("/verify-domain")
def verify_domain(payload: DomainRequest):
    return {"verified": True, "domain": payload.url}


@router.get("/integrations")
def get_onboarding_integrations():
    return {"integrations": INTEGRATIONS_SETTINGS[:2]}
