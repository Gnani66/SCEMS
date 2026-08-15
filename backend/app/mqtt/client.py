import paho.mqtt.client as mqtt

from app.config.settings import settings
from app.mqtt.handlers import handle_message


class MQTTClient:

    def __init__(self):
        self.connected = False

        self.client = mqtt.Client(
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
            client_id="SCEMS_FASTAPI_BACKEND",
            protocol=mqtt.MQTTv5,
        )

        self.client.on_connect = self.on_connect
        self.client.on_disconnect = (
            self.on_disconnect
        )
        self.client.on_message = self.on_message

    def on_disconnect(
        self,
        client,
        userdata,
        disconnect_flags,
        reason_code,
        properties,
    ):

        print(
            f"[MQTT] Disconnected: {reason_code}"
        )

        self.connected = False

    def on_connect(
        self,
        client,
        userdata,
        flags,
        reason_code,
        properties,
    ):
        print(
            f"[MQTT] Backend connected: "
            f"{reason_code}"
        )

        self.connected = True

        client.subscribe(
            f"{settings.mqtt_base_topic}/#",
            qos=1,
        )

        print(
            f"[MQTT] Subscribed to "
            f"{settings.mqtt_base_topic}/#"
        )

    def on_message(
        self,
        client,
        userdata,
        message,
    ):
        payload = message.payload.decode("utf-8")

        handle_message(
            message.topic,
            payload,
        )

    def start(self):
        print(
            f"[MQTT] Connecting to "
            f"{settings.mqtt_host}:"
            f"{settings.mqtt_port}"
        )

        self.client.connect(
            settings.mqtt_host,
            settings.mqtt_port,
            settings.mqtt_keepalive,
        )

        self.client.loop_start()

    def stop(self):
        self.client.loop_stop()
        self.client.disconnect()