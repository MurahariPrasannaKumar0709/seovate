from fastapi import APIRouter

from app.mock_data.store import INTEGRATIONS_SETTINGS

router = APIRouter()

_connection_state = {i["name"]: i["status"] == "Connected" for i in INTEGRATIONS_SETTINGS}


@router.get("")
def get_integrations():
    return {"integrations": INTEGRATIONS_SETTINGS}


@router.post("/{name}/connect")
def connect_integration(name: str):
    _connection_state[name] = True
    return {"name": name, "connected": True}
