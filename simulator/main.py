import time

from nodes.node_01 import create_node_01

from mqtt_client import MQTTClient

from config.simulator_config import SIMULATION_INTERVAL
from config.topics import (
    data_topic,
    health_topic,
    status_topic,
)


def publish_node_data(node, mqtt_client, node_number):
    reading = node.generate_reading()
    health = node.generate_health()

    mqtt_client.publish(
        data_topic(node_number),
        reading,
    )

    mqtt_client.publish(
        health_topic(node_number),
        health,
    )


def publish_status(mqtt_client, node_number, status):
    mqtt_client.publish(
        status_topic(node_number),
        {
            "node_id": f"SCEMS_NODE_{node_number}",
            "status": status,
        },
    )


def main():
    node_01 = create_node_01()

    mqtt_client = MQTTClient(
        client_id="SCEMS_VIRTUAL_SIMULATOR"
    )

    mqtt_client.connect()

    publish_status(
        mqtt_client,
        "01",
        "online",
    )

    print()
    print("SCEMS Virtual Sensor System")
    print("Node 01 -> ONLINE (single-node mode)")
    print()

    try:
        while True:
            publish_node_data(
                node_01,
                mqtt_client,
                "01",
            )

            time.sleep(SIMULATION_INTERVAL)

    except KeyboardInterrupt:
        print()
        print("Stopping simulator...")

        publish_status(
            mqtt_client,
            "01",
            "offline",
        )

        mqtt_client.disconnect()


if __name__ == "__main__":
    main()