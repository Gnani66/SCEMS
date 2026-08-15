from nodes.node_01 import VirtualNode


def create_node_02():
    return VirtualNode(
        node_id="SCEMS_NODE_02",
        name="Node 02",
        location="Library",
    )