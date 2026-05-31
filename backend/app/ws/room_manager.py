import json
from collections import defaultdict

from fastapi import WebSocket


class RoomConnectionManager:
    def __init__(self):
        # room_id -> {user_id: WebSocket}
        self._rooms: dict[str, dict[str, WebSocket]] = defaultdict(dict)

    def connect(self, room_id: str, user_id: str, ws: WebSocket):
        self._rooms[room_id][user_id] = ws

    def disconnect(self, room_id: str, user_id: str):
        self._rooms[room_id].pop(user_id, None)
        if not self._rooms[room_id]:
            del self._rooms[room_id]

    async def broadcast(self, room_id: str, message: dict):
        payload = json.dumps(message)
        dead = []
        for uid, ws in list(self._rooms.get(room_id, {}).items()):
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(uid)
        for uid in dead:
            self.disconnect(room_id, uid)

    async def send_to(self, room_id: str, user_id: str, message: dict):
        ws = self._rooms.get(room_id, {}).get(user_id)
        if ws:
            await ws.send_text(json.dumps(message))

    def room_state(self, room_id: str) -> list[str]:
        return list(self._rooms.get(room_id, {}).keys())


manager = RoomConnectionManager()
