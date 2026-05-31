-- FocusForest canonical schema (source of truth: db/migrations/V*.sql)
-- This file is for reference only — Flyway owns the actual migrations.

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invite_code TEXT UNIQUE NOT NULL,
    is_open BOOLEAN NOT NULL DEFAULT TRUE,
    scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE room_members (
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (room_id, user_id)
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    -- Allowed values: 1800 | 2700 | 3600 | 5400 | 7200
    duration_secs INT NOT NULL CHECK (duration_secs IN (1800, 2700, 3600, 5400, 7200)),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'in_progress' -- in_progress | completed | failed
);

CREATE TABLE trees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- tree_type: common (30m) | uncommon (45m) | epic (1h) | arcane (1.5h) | diamond (2h)
    tree_type TEXT NOT NULL,
    -- stage advances: small (0-33%) → medium (33-66%) → large (66-100%)
    stage TEXT NOT NULL DEFAULT 'small',
    is_alive BOOLEAN NOT NULL DEFAULT TRUE,
    -- in_forest = TRUE only when session completes successfully
    in_forest BOOLEAN NOT NULL DEFAULT FALSE,
    died_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
