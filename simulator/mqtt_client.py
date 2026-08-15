import json
import paho.mqtt.client as mqtt

from config.mqtt_config import (
    MQTT_BROKER,
    MQTT_PORT,
    MQTT_KEEPALIVE,
)


class MQTTClient:
    def __init__(self, client_id):
        self.client_id = client_id

        self.client = mqtt.Client(
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
            client_id=client_id,
            protocol=mqtt.MQTTv5,
        )

    def connect(self):
        print(
            f"[MQTT] Connecting to "
            f"{MQTT_BROKER}:{MQTT_PORT}..."
        )

        self.client.connect(
            MQTT_BROKER,
            MQTT_PORT,
            MQTT_KEEPALIVE,
        )

        self.client.loop_start()

        print("[MQTT] Connected")

    def publish(self, topic, payload):
        message = json.dumps(payload)

        result = self.client.publish(
            topic,
            message,
            qos=1,
        )

        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print(f"[MQTT] Published -> {topic}")
        else:
            print(
                f"[MQTT] Publish failed -> {topic}"
            )

    def disconnect(self):
        self.client.loop_stop()
        self.client.disconnect()

        print("[MQTT] Disconnected")