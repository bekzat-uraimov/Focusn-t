CREATE TYPE session_status AS ENUM ('in_progress', 'completed', 'failed');

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    duration_secs INT NOT NULL CHECK (duration_secs IN (1800, 2700, 3600, 5400, 7200)),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    status session_status NOT NULL DEFAULT 'in_progress'
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_room ON sessions(room_id);
