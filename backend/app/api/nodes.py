from fastapi import APIRouter

from app.services.storage import (
    latest_health,
    latest_readings,
    node_status,
)


router = APIRouter(
    prefix="/api/nodes",
    tags=["Nodes"],
)


@router.get("")
def get_nodes():

    node_ids = set()

    node_ids.update(latest_readings.keys())
    node_ids.update(latest_health.keys())
    node_ids.update(node_status.keys())

    nodes = []

    for node_id in sorted(node_ids):

        nodes.append(
            {
                "node_id": node_id,
                "status": node_status.get(
                    node_id,
                    {},
                ).get(
                    "status",
                    "unknown",
                ),
                "latest_reading":
                    latest_readings.get(node_id),

                "health":
                    latest_health.get(node_id),
            }
        )

    return {
        "count": len(nodes),
        "nodes": nodes,
    }