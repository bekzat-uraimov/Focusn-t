import pytest
from httpx import AsyncClient


async def _auth(client: AsyncClient, email: str) -> str:
    await client.post("/auth/register", json={"email": email, "name": "User", "password": "pw"})
    r = await client.post("/auth/login", json={"email": email, "password": "pw"})
    return r.json()["access_token"]


@pytest.mark.asyncio
async def test_create_and_explore_room(client: AsyncClient):
    token = await _auth(client, "dave@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    r = await client.post("/rooms", json={"name": "CS Homework", "is_open": True}, headers=headers)
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "CS Homework"
    invite = data["invite_code"]

    r2 = await client.get("/rooms/explore", headers=headers)
    assert r2.status_code == 200
    ids = [room["id"] for room in r2.json()]
    assert data["id"] in ids


@pytest.mark.asyncio
async def test_join_room(client: AsyncClient):
    token_owner = await _auth(client, "eve@test.com")
    token_joiner = await _auth(client, "frank@test.com")

    r = await client.post("/rooms", json={"name": "Private Room", "is_open": False},
                          headers={"Authorization": f"Bearer {token_owner}"})
    room_id = r.json()["id"]
    invite_code = r.json()["invite_code"]

    r2 = await client.post(f"/rooms/{room_id}/join",
                           json={"invite_code": invite_code},
                           headers={"Authorization": f"Bearer {token_joiner}"})
    assert r2.status_code == 200
    member_ids = [m["user_id"] for m in r2.json()["members"]]
    assert len(member_ids) == 2
