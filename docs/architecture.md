# SCEMS Architecture

## System Overview

SCEMS consists of distributed environmental sensor nodes communicating with a central software platform.

## Current Phase

Phase 1 prototype:
- 2 sensor nodes
- MQTT communication
- Centralized database
- Real-time dashboard
- Historical visualization
- Threshold-based alerts
- Node health monitoring

## Architecture

                    SENSOR LAYER

              ┌──────────────────┐
              │   NODE 01        │
              │   ESP32          │
              │   Environmental  │
              │   Sensors        │
              └────────┬─────────┘
                       │
                       │ MQTT
                       │
              ┌────────▼─────────┐
              │   NODE 02        │
              │   ESP32          │
              │   Environmental  │
              │   Sensors        │
              └────────┬─────────┘
                       │
                       ▼

                  MQTT BROKER
                   Mosquitto
                       │
                       ▼

                   FastAPI
                    Backend
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
        PostgreSQL          WebSocket
              │                 │
              └────────┬────────┘
                       ▼
                  Next.js
                  Dashboard

## Development Strategy

During virtual development, Python-based sensor simulators will replace the physical ESP32 nodes.

The simulator must use the same MQTT message structure planned for the real ESP32 nodes.

When hardware becomes available, the simulator will be replaced by ESP32 firmware without changing the backend architecture.