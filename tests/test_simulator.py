import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1] / "simulator"))

from nodes.node_01 import create_node_01


def test_node_identity():
    node = create_node_01()

    assert node.node_id == "SCEMS_NODE_01"
    assert node.name == "Node 01"


def test_sensor_readings():
    node = create_node_01()

    reading = node.generate_reading()

    data = reading["data"]

    expected_fields = [
        "temperature",
        "humidity",
        "pressure",
        "aqi",
        "tvoc",
        "eco2",
        "light",
        "rain",
        "sound",
        "uv",
    ]

    for field in expected_fields:
        assert field in data


def test_health_data():
    node = create_node_01()

    health = node.generate_health()

    assert health["node_id"] == "SCEMS_NODE_01"
    assert "wifi_rssi" in health
    assert "uptime" in health
    assert "free_heap" in health