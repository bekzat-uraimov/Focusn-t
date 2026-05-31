CREATE TYPE tree_type AS ENUM ('common', 'uncommon', 'epic', 'arcane', 'diamond');
CREATE TYPE tree_stage AS ENUM ('small', 'medium', 'large');

CREATE TABLE trees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tree_type tree_type NOT NULL,
    stage tree_stage NOT NULL DEFAULT 'small',
    is_alive BOOLEAN NOT NULL DEFAULT TRUE,
    in_forest BOOLEAN NOT NULL DEFAULT FALSE,
    died_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trees_user ON trees(user_id);
CREATE INDEX idx_trees_forest ON trees(user_id, in_forest);
