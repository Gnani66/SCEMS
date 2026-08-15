from app.database.connection import get_connection


def upsert_node(
    node_id: str,
    name: str,
    location: str,
    status: str | None = None,
    firmware_version: str | None = None,
):
    with get_connection() as connection:
        with connection.cursor() as cursor:

            cursor.execute(
                """
                INSERT INTO nodes (
                    node_id,
                    name,
                    location,
                    status,
                    firmware_version,
                    last_seen,
                    updated_at
                )
                VALUES (
                    %s, %s, %s, %s, %s, NOW(), NOW()
                )
                ON CONFLICT (node_id)
                DO UPDATE SET
                    name = EXCLUDED.name,
                    location = EXCLUDED.location,
                    status = COALESCE(
                        EXCLUDED.status,
                        nodes.status
                    ),
                    firmware_version = COALESCE(
                        EXCLUDED.firmware_version,
                        nodes.firmware_version
                    ),
                    last_seen = NOW(),
                    updated_at = NOW()
                """,
                (
                    node_id,
                    name,
                    location,
                    status or "online",
                    firmware_version,
                ),
            )

        connection.commit()


def insert_sensor_reading(data: dict):

    sensor_data = data["data"]

    with get_connection() as connection:
        with connection.cursor() as cursor:

            cursor.execute(
                """
                INSERT INTO sensor_readings (
                    node_id,
                    timestamp,
                    temperature,
                    humidity,
                    pressure,
                    aqi,
                    tvoc,
                    eco2,
                    light,
                    rain,
                    sound,
                    uv
                )
                VALUES (
                    %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s
                )
                """,
                (
                    data["node_id"],
                    data["timestamp"],
                    sensor_data["temperature"],
                    sensor_data["humidity"],
                    sensor_data["pressure"],
                    sensor_data["aqi"],
                    sensor_data["tvoc"],
                    sensor_data["eco2"],
                    sensor_data["light"],
                    sensor_data["rain"],
                    sensor_data["sound"],
                    sensor_data["uv"],
                ),
            )

        connection.commit()


def insert_node_health(data: dict):

    with get_connection() as connection:
        with connection.cursor() as cursor:

            cursor.execute(
                """
                INSERT INTO node_health (
                    node_id,
                    timestamp,
                    wifi_rssi,
                    uptime,
                    free_heap,
                    firmware_version
                )
                VALUES (
                    %s, %s, %s, %s, %s, %s
                )
                """,
                (
                    data["node_id"],
                    data["timestamp"],
                    data["wifi_rssi"],
                    data["uptime"],
                    data["free_heap"],
                    data["firmware_version"],
                ),
            )

        connection.commit()


def insert_alert(alert: dict):

    with get_connection() as connection:
        with connection.cursor() as cursor:

            cursor.execute(
                """
                INSERT INTO alerts (
                    node_id,
                    sensor,
                    alert_type,
                    threshold,
                    actual_value,
                    severity,
                    status,
                    message
                )
                VALUES (
                    %s, %s, %s, %s,
                    %s, %s, 'active', %s
                )
                """,
                (
                    alert["node_id"],
                    alert["sensor"],
                    alert["alert_type"],
                    alert["threshold"],
                    alert["actual_value"],
                    alert["severity"],
                    alert["message"],
                ),
            )

        connection.commit()


def update_node_status(
    node_id: str,
    status: str,
):

    with get_connection() as connection:
        with connection.cursor() as cursor:

            cursor.execute(
                """
                UPDATE nodes
                SET
                    status = %s,
                    last_seen = NOW(),
                    updated_at = NOW()
                WHERE node_id = %s
                """,
                (
                    status,
                    node_id,
                ),
            )

        connection.commit()