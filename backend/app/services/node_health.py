def evaluate_node_health(
    health: dict,
):

    issues = []

    node_id = health["node_id"]
    rssi = health["wifi_rssi"]
    free_heap = health["free_heap"]

    if rssi <= -70:

        issues.append(
            {
                "node_id": node_id,
                "type": "weak_wifi",
                "severity": "warning",
                "message": (
                    f"Weak Wi-Fi signal: {rssi} dBm"
                ),
            }
        )

    if free_heap < 50000:

        issues.append(
            {
                "node_id": node_id,
                "type": "low_memory",
                "severity": "critical",
                "message": (
                    f"Low free heap: {free_heap}"
                ),
            }
        )

    return issues