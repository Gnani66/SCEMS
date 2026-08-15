from app.config.thresholds import THRESHOLDS


def evaluate_reading(reading: dict):

    alerts = []

    node_id = reading["node_id"]
    sensor_data = reading["data"]

    for sensor, limits in THRESHOLDS.items():

        if sensor not in sensor_data:
            continue

        value = sensor_data[sensor]

        if value >= limits["critical"]:

            alerts.append(
                {
                    "node_id": node_id,
                    "sensor": sensor,
                    "alert_type": "threshold",
                    "threshold": limits["critical"],
                    "actual_value": value,
                    "severity": "critical",
                    "message": (
                        f"{sensor} reached "
                        f"critical level: {value}"
                    ),
                }
            )

        elif value >= limits["warning"]:

            alerts.append(
                {
                    "node_id": node_id,
                    "sensor": sensor,
                    "alert_type": "threshold",
                    "threshold": limits["warning"],
                    "actual_value": value,
                    "severity": "warning",
                    "message": (
                        f"{sensor} exceeded "
                        f"warning level: {value}"
                    ),
                }
            )

    return alerts