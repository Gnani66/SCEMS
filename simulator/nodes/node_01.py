from datetime import datetime, timezone
import random

from sensors.sensor_models import SensorSimulator


class VirtualNode:
    def __init__(self, node_id, name, location):
        self.node_id = node_id
        self.name = name
        self.location = location

        self.sensor = SensorSimulator()

        self.uptime = 0
        self.firmware_version = "virtual-1.0.0"

    def generate_reading(self):
        self.sensor.update()

        readings = self.sensor.get_readings()

        return {
            "node_id": self.node_id,
            "node_name": self.name,
            "location": self.location,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": readings,
        }

    def generate_health(self):
        self.uptime += 5

        return {
            "node_id": self.node_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "wifi_rssi": random.randint(-70, -45),
            "uptime": self.uptime,
            "free_heap": random.randint(150000, 220000),
            "firmware_version": self.firmware_version,
        }


def create_node_01():
    return VirtualNode(
        node_id="SCEMS_NODE_01",
        name="Node 01",
        location="Main Block",
    )