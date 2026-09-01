# SCEMS

## Smart Campus Environmental Monitoring System

SCEMS is a distributed IoT-based environmental monitoring system designed to monitor environmental conditions across a campus using multiple sensor nodes.

## Phase 1

The Phase 1 prototype consists of two distributed sensor nodes.

### Sensors

- BME280
  - Temperature
  - Humidity
  - Pressure
- ENS160
  - AQI
  - TVOC
  - eCO₂
- BH1750
  - Light
- Rain Sensor
- Sound Sensor
- UV Sensor

## Architecture

ESP32 Sensor Nodes
        ↓
      MQTT
        ↓
   Mosquitto
        ↓
     FastAPI
        ↓
   PostgreSQL
        ↓
   WebSocket
        ↓
    Next.js
        ↓
 SCEMS Dashboard

## Software Stack

- ESP32 / Arduino
- Python
- MQTT
- Mosquitto
- FastAPI
- PostgreSQL
- Next.js
- TypeScript
- Docker
- GitHub

## Development Phases

- Phase 0 — Foundation
- Phase 1 — Virtual Sensor Nodes
- Phase 2 — MQTT Communication
- Phase 3 — FastAPI Backend
- Phase 4 — PostgreSQL Database
- Phase 5 — Real-Time Communication
- Phase 6 — Web Dashboard
- Phase 7 — Alerts & Node Health
- Phase 8 — Virtual Integration Testing
- Phase 9 — Docker & Deployment
- Phase 10 — Hardware Integration