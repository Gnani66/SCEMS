import time


NODE_TIMEOUT_SECONDS = 15

last_seen = {}


def update_last_seen(node_id: str):

    last_seen[node_id] = time.time()


def get_offline_nodes():

    now = time.time()

    offline = []

    for node_id, timestamp in last_seen.items():

        if now - timestamp > NODE_TIMEOUT_SECONDS:

            offline.append(node_id)

    return offline