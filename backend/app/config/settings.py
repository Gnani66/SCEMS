from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[3]
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):

    mqtt_host: str = "localhost"
    mqtt_port: int = 1883
    mqtt_keepalive: int = 60

    mqtt_base_topic: str = "scems"

    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    database_url: str

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        extra="ignore",
    )


settings = Settings()