from fastapi import APIRouter

from app.services.storage import latest_health


router = APIRouter(
    prefix="/api/health",
    tags=["Node Health"],
)


@router.get("")
def get_health():

    return {
        "count": len(latest_health),
        "nodes": latest_health,
    }