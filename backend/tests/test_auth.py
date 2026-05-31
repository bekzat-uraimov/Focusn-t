import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    r = await client.post("/auth/register", json={"email": "alice@test.com", "name": "Alice", "password": "secret"})
    assert r.status_code == 201
    assert "access_token" in r.json()

    r2 = await client.post("/auth/login", json={"email": "alice@test.com", "password": "secret"})
    assert r2.status_code == 200
    assert "access_token" in r2.json()


@pytest.mark.asyncio
async def test_duplicate_email(client: AsyncClient):
    await client.post("/auth/register", json={"email": "bob@test.com", "name": "Bob", "password": "pw"})
    r = await client.post("/auth/register", json={"email": "bob@test.com", "name": "Bob2", "password": "pw"})
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_wrong_password(client: AsyncClient):
    await client.post("/auth/register", json={"email": "carol@test.com", "name": "Carol", "password": "right"})
    r = await client.post("/auth/login", json={"email": "carol@test.com", "password": "wrong"})
    assert r.status_code == 401
