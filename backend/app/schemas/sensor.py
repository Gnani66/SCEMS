from datetime import datetime

from pydantic import BaseModel


class SensorData(BaseModel):
    temperature: float
    humidity: float
    pressure: float

    aqi: float
    tvoc: float
    eco2: float

    light: float
    rain: bool
    sound: float
    uv: float


class SensorReading(BaseModel):
    node_id: str
    node_name: str
    location: str
    timestamp: datetime
    data: SensorData