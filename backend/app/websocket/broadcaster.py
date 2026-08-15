import asyncio


class WebSocketBroadcaster:

    def __init__(self):
        self.manager = None
        self.loop = None

    def initialize(
        self,
        manager,
        loop,
    ):
        self.manager = manager
        self.loop = loop

    def broadcast(
        self,
        message: dict,
    ):

        if not self.manager:
            return

        if not self.loop:
            return

        asyncio.run_coroutine_threadsafe(
            self.manager.broadcast(message),
            self.loop,
        )


broadcaster = WebSocketBroadcaster()
