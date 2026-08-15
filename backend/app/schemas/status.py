from pydantic import BaseModel


class NodeStatus(BaseModel):
    node_id: str
    status: str