from datetime import datetime

from pydantic import BaseModel


class NodeHealth(BaseModel):
    node_id: str
    timestamp: datetime
    wifi_rssi: int
    uptime: int
    free_heap: int
    firmware_version: str