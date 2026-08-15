import json

from app.services.alert_engine import (
    evaluate_reading,
)

from app.services.database_service import (
    insert_alert,
    insert_node_health,
    insert_sensor_reading,
    update_node_status,
    upsert_node,
)

from app.services.node_monitor import (
    update_last_seen,
)

from app.services.storage import (
    latest_health,
    latest_readings,
    node_status,
    reading_history,
)

from app.websocket.broadcaster import (
    broadcaster,
)


def handle_data(payload: str):

    data = json.loads(payload)

    node_id = data["node_id"]

    update_last_seen(node_id)

    # Temporary in-memory storage
    latest_readings[node_id] = data
    reading_history.append(data)

    # Push live update immediately
    broadcaster.broadcast(
        {
            "type": "sensor_data",
            "data": data,
        }
    )

    # Persistent database storage
    try:

        upsert_node(
            node_id=node_id,
            name=data["node_name"],
            location=data["location"],
        )

        insert_sensor_reading(data)

    except Exception as error:

        print(
            f"[DB] Reading store failed: "
            f"{error}"
        )

    alerts = evaluate_reading(data)

    for alert in alerts:

        try:

            insert_alert(alert)

        except Exception as error:

            print(
                f"[DB] Alert store failed: "
                f"{error}"
            )

        broadcaster.broadcast(
            {
                "type": "alert",
                "data": alert,
            }
        )

        print(
            f"[ALERT] "
            f"{alert['severity'].upper()} "
            f"{alert['node_id']} "
            f"{alert['sensor']}"
        )

    print(
        f"[MQTT → DB → WS] "
        f"Sensor data → {node_id}"
    )


def handle_health(payload: str):

    data = json.loads(payload)

    node_id = data["node_id"]

    latest_health[node_id] = data

    broadcaster.broadcast(
        {
            "type": "node_health",
            "data": data,
        }
    )

    try:

        upsert_node(
            node_id=node_id,
            name=f"Node {node_id[-2:]}",
            location="Unknown",
            firmware_version=data[
                "firmware_version"
            ],
        )

        insert_node_health(data)

    except Exception as error:

        print(
            f"[DB] Health store failed: "
            f"{error}"
        )

    print(
        f"[MQTT → DB] Health stored → {node_id}"
    )


def handle_status(payload: str):

    data = json.loads(payload)

    node_id = data["node_id"]
    status = data["status"]

    node_status[node_id] = data

    broadcaster.broadcast(
        {
            "type": "node_status",
            "data": data,
        }
    )

    try:

        update_node_status(
            node_id,
            status,
        )

    except Exception as error:

        print(
            f"[DB] Status store failed: "
            f"{error}"
        )

    print(
        f"[MQTT → DB] Status stored → "
        f"{node_id}: {status}"
    )


def handle_message(
    topic: str,
    payload: str,
):

    try:

        if topic.endswith("/data"):
            handle_data(payload)

        elif topic.endswith("/health"):
            handle_health(payload)

        elif topic.endswith("/status"):
            handle_status(payload)

        else:
            print(
                f"[MQTT] Unknown topic: {topic}"
            )

    except Exception as error:

        print(
            f"[MQTT ERROR] {error}"
        )