from datetime import datetime

from fastapi import APIRouter, HTTPException

from app.database.connection import get_connection


router = APIRouter(
    prefix="/api/alerts",
    tags=["Alerts"],
)


@router.get("")
def get_alerts(
    status: str | None = None,
    limit: int = 100,
):

    with get_connection() as connection:

        with connection.cursor() as cursor:

            if status:

                cursor.execute(
                    """
                    SELECT *
                    FROM alerts
                    WHERE status = %s
                    ORDER BY created_at DESC
                    LIMIT %s
                    """,
                    (
                        status,
                        limit,
                    ),
                )

            else:

                cursor.execute(
                    """
                    SELECT *
                    FROM alerts
                    ORDER BY created_at DESC
                    LIMIT %s
                    """,
                    (limit,),
                )

            rows = cursor.fetchall()

    return {
        "count": len(rows),
        "alerts": rows,
    }


@router.patch("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int):

    with get_connection() as connection:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                UPDATE alerts
                SET
                    status = 'acknowledged',
                    acknowledged_at = %s
                WHERE id = %s
                RETURNING *
                """,
                (
                    datetime.utcnow(),
                    alert_id,
                ),
            )

            alert = cursor.fetchone()

        connection.commit()

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found",
        )

    return alert