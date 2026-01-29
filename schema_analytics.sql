CREATE TABLE IF NOT EXISTS click_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    country TEXT,
    referrer TEXT,
    user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_click_events_slug ON click_events(slug);
CREATE INDEX IF NOT EXISTS idx_click_events_timestamp ON click_events(timestamp);
