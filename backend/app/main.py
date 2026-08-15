import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.analytics import router as analytics_router
from app.mqtt.client import MQTTClient
from app.api.nodes import router as nodes_router
from app.api.readings import router as readings_router
from app.api.health import router as health_router
from app.api.alerts import router as alerts_router
from app.api.websocket import router as websocket_router
from app.api.websocket import manager
from app.websocket.broadcaster import broadcaster
from app.config.logging_config import (
    configure_logging,
)


mqtt_client = MQTTClient()


@asynccontextmanager
async def lifespan(app: FastAPI):

    configure_logging()

    loop = asyncio.get_running_loop()

    broadcaster.initialize(
        manager,
        loop,
    )

    mqtt_client.start()

    yield

    mqtt_client.stop()


app = FastAPI(
    title="SCEMS API",
    description="Smart Campus Environmental Monitoring System API",
    version="0.2.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(nodes_router)
app.include_router(readings_router)
app.include_router(health_router)
app.include_router(alerts_router)
app.include_router(websocket_router)
app.include_router(analytics_router)


@app.get("/")
def root():
    return {
        "system": "SCEMS",
        "status": "online",
        "version": "0.2.0",
    }


@app.get("/health")
def health():

    import threading

    database_status = "unknown"
    check_result = {}

    def check_database():

        try:

            from app.database.connection import get_connection

            with get_connection() as connection:
                with connection.cursor() as cursor:

                    cursor.execute("SELECT 1")

                    cursor.fetchone()

            check_result["status"] = "healthy"

        except Exception:

            check_result["status"] = "unhealthy"

    checker = threading.Thread(
        target=check_database,
        daemon=True,
    )

    checker.start()

    checker.join(timeout=4)

    database_status = check_result.get(
        "status",
        "unhealthy",
    )

    return {
        "service": "SCEMS Backend",
        "status": "healthy",
        "database": database_status,
        "mqtt": (
            "running"
            if mqtt_client.connected
            else "disconnected"
        ),
    }