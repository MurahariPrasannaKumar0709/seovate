from fastapi import APIRouter

from app.services.repo_scan import scan_repo

router = APIRouter()

_pr_state = {"status": "open"}

CHANGES = [
    {"path": "sitemap.xml", "action": "New file"},
    {"path": "public/schema/local-business.json", "action": "New file"},
    {"path": "robots.txt", "action": "Update"},
]


@router.get("/scan")
def get_repo_scan():
    return {"repo": "seovate/frisco-plumbing-site", "files": scan_repo()}


@router.get("/consent")
def get_consent_changes():
    return {"changes": CHANGES}


@router.post("/consent/approve")
def approve_changes():
    _pr_state["status"] = "open"
    return {"pr_number": 142, "status": _pr_state["status"]}


@router.get("/pull-request")
def get_pull_request():
    return {"pr_number": 142, "status": _pr_state["status"], "changes": CHANGES}


@router.post("/pull-request/merge")
def merge_pull_request():
    _pr_state["status"] = "merged"
    return {"pr_number": 142, "status": _pr_state["status"]}


@router.post("/pull-request/close")
def close_pull_request():
    _pr_state["status"] = "closed"
    return {"pr_number": 142, "status": _pr_state["status"]}
