from collections import defaultdict
from fastapi import WebSocket
import json


class ConnectionManager:
    def __init__(self):
        self._rooms: dict[str, set] = defaultdict(set)
        self._ws_to_user: dict[int, str] = {}

    async def connect(self, room_id: str, user_id: str, ws: WebSocket):
        self._rooms[room_id].add((user_id, ws))
        self._ws_to_user[id(ws)] = user_id

    def disconnect(self, room_id: str, ws: WebSocket) -> str | None:
        user_id = self._ws_to_user.pop(id(ws), None)
        if user_id:
            self._rooms[room_id].discard((user_id, ws))
        if not self._rooms.get(room_id):
            self._rooms.pop(room_id, None)
        return user_id

    async def broadcast(self, room_id: str, message: dict, exclude: WebSocket | None = None):
        dead = []
        for uid, ws in list(self._rooms.get(room_id, [])):
            if ws is exclude:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                dead.append((uid, ws))
        for item in dead:
            self._rooms[room_id].discard(item)

    def get_members(self, room_id: str) -> list[str]:
        return [uid for uid, _ in self._rooms.get(room_id, [])]


manager = ConnectionManager()
