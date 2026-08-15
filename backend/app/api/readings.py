from datetime import datetime, timedelta, timezone

from fastapi import APIRouter

from app.database.connection import get_connection


router = APIRouter(
    prefix="/api/readings",
    tags=["Readings"],
)


@router.get("/latest")
def get_latest_readings():

    with get_connection() as connection:
        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT DISTINCT ON (node_id)
                    *
                FROM sensor_readings
                ORDER BY node_id, timestamp DESC
                """
            )

            rows = cursor.fetchall()

    return {
        "count": len(rows),
        "readings": rows,
    }


@router.get("/history")
def get_reading_history(
    node_id: str | None = None,
    hours: int = 24,
    limit: int = 1000,
):

    start_time = (
        datetime.now(timezone.utc)
        - timedelta(hours=hours)
    )

    with get_connection() as connection:

        with connection.cursor() as cursor:

            if node_id:

                cursor.execute(
                    """
                    SELECT *
                    FROM sensor_readings
                    WHERE node_id = %s
                    AND timestamp >= %s
                    ORDER BY timestamp ASC
                    LIMIT %s
                    """,
                    (
                        node_id,
                        start_time,
                        limit,
                    ),
                )

            else:

                cursor.execute(
                    """
                    SELECT *
                    FROM sensor_readings
                    WHERE timestamp >= %s
                    ORDER BY timestamp ASC
                    LIMIT %s
                    """,
                    (
                        start_time,
                        limit,
                    ),
                )

            rows = cursor.fetchall()

    return {
        "count": len(rows),
        "hours": hours,
        "readings": rows,
    }