import pytest
from httpx import AsyncClient


async def _setup(client: AsyncClient, email: str):
    await client.post("/auth/register", json={"email": email, "name": "U", "password": "pw"})
    r = await client.post("/auth/login", json={"email": email, "password": "pw"})
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    room = await client.post("/rooms", json={"name": "Room", "is_open": True}, headers=headers)
    return headers, room.json()["id"]


@pytest.mark.asyncio
async def test_invalid_duration_rejected(client: AsyncClient):
    headers, room_id = await _setup(client, "grace@test.com")
    r = await client.post("/sessions", json={"room_id": room_id, "duration_secs": 999}, headers=headers)
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_session_complete_adds_to_forest(client: AsyncClient):
    headers, room_id = await _setup(client, "hank@test.com")

    r = await client.post("/sessions", json={"room_id": room_id, "duration_secs": 3600}, headers=headers)
    assert r.status_code == 201
    session_id = r.json()["id"]

    r2 = await client.patch(f"/sessions/{session_id}",
                            json={"status": "completed", "elapsed_secs": 3600}, headers=headers)
    assert r2.status_code == 200

    profile = await client.get("/users/me", headers=headers)
    forest = profile.json()["forest"]
    assert len(forest) == 1
    assert forest[0]["tree_type"] == "epic"
    assert forest[0]["in_forest"] is True


@pytest.mark.asyncio
async def test_session_fail_tree_dead(client: AsyncClient):
    headers, room_id = await _setup(client, "iris@test.com")

    r = await client.post("/sessions", json={"room_id": room_id, "duration_secs": 1800}, headers=headers)
    session_id = r.json()["id"]

    r2 = await client.patch(f"/sessions/{session_id}",
                            json={"status": "failed", "elapsed_secs": 600}, headers=headers)
    assert r2.status_code == 200

    profile = await client.get("/users/me", headers=headers)
    assert profile.json()["forest"] == []
