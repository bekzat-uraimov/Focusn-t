ALTER TYPE session_status ADD VALUE 'scheduled';

ALTER TABLE rooms
    ADD COLUMN scheduled_duration_secs INT
        CHECK (scheduled_duration_secs IN (1800, 2700, 3600, 5400, 7200));
