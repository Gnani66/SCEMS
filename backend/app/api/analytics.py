from fastapi import APIRouter

from app.database.connection import get_connection


router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"],
)


@router.get("/summary")
def get_summary(
    node_id: str,
    hours: int = 24,
):

    with get_connection() as connection:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    COUNT(*) AS reading_count,

                    AVG(temperature) AS avg_temperature,
                    MIN(temperature) AS min_temperature,
                    MAX(temperature) AS max_temperature,

                    AVG(humidity) AS avg_humidity,
                    MIN(humidity) AS min_humidity,
                    MAX(humidity) AS max_humidity,

                    AVG(aqi) AS avg_aqi,
                    MIN(aqi) AS min_aqi,
                    MAX(aqi) AS max_aqi,

                    AVG(light) AS avg_light,
                    AVG(sound) AS avg_sound,
                    AVG(uv) AS avg_uv

                FROM sensor_readings

                WHERE node_id = %s

                AND timestamp >=
                    NOW() -
                    (%s * INTERVAL '1 hour')
                """,
                (
                    node_id,
                    hours,
                ),
            )

            result = cursor.fetchone()

    return result


@router.get("/comparison")
def compare_nodes(
    hours: int = 24,
):

    with get_connection() as connection:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    node_id,

                    AVG(temperature)
                        AS avg_temperature,

                    AVG(humidity)
                        AS avg_humidity,

                    AVG(aqi)
                        AS avg_aqi,

                    AVG(light)
                        AS avg_light,

                    AVG(sound)
                        AS avg_sound,

                    AVG(uv)
                        AS avg_uv

                FROM sensor_readings

                WHERE timestamp >=
                    NOW() -
                    (%s * INTERVAL '1 hour')

                GROUP BY node_id

                ORDER BY node_id
                """,
                (hours,),
            )

            rows = cursor.fetchall()

    return {
        "hours": hours,
        "nodes": rows,
    }