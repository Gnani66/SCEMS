def data_topic(node_number):
    return f"scems/node/{node_number}/data"


def health_topic(node_number):
    return f"scems/node/{node_number}/health"


def status_topic(node_number):
    return f"scems/node/{node_number}/status"