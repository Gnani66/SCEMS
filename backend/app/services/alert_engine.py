import time

from app.config.thresholds import THRESHOLDS

# Cooldown per node+sensor to prevent spam: 5 minutes
_ALERT_COOLDOWN_SECONDS = 300
_last_alert_at: dict[str, float] = {}


def _cooldown_key(node_id: str, sensor: str, severity: str) -> str:
    return f"{node_id}:{sensor}:{severity}"


def _should_emit(node_id: str, sensor: str, severity: str) -> bool:
    key = _cooldown_key(node_id, sensor, severity)
    now = time.time()
    last = _last_alert_at.get(key)
    if last is not None and (now - last) < _ALERT_COOLDOWN_SECONDS:
        return False
    _last_alert_at[key] = now
    return True


def evaluate_reading(reading: dict):

    alerts = []

    node_id = reading["node_id"]
    sensor_data = reading["data"]

    for sensor, limits in THRESHOLDS.items():

        if sensor not in sensor_data:
            continue

        value = sensor_data[sensor]

        if value >= limits["critical"]:
            if _should_emit(node_id, sensor, "critical"):
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
            if _should_emit(node_id, sensor, "warning"):
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