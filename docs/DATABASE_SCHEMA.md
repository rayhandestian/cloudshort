# Database Schema

Cloudshort uses a split-storage model: **Cloudflare D1** for canonical data and management, and **Cloudflare KV** for high-performance edge lookups.

## Cloudflare D1 (SQLite)

The `cloudshort-db` D1 database acts as the single source of truth.

### Table: `links`

Main table for storing URL mappings and metadata.

```sql
CREATE TABLE links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,       -- The short path (e.g., 'twitter')
  long_url TEXT NOT NULL,          -- The destination URL
  created_at INTEGER NOT NULL,     -- Unix timestamp
  created_by TEXT,                 -- Email from CF Access
  clicks INTEGER DEFAULT 0,        -- Simple counter
  is_active BOOLEAN DEFAULT 1      -- Soft delete/disable flag
);
```

### Indexes

Optimized for valid dashboard sorting and retrieval.

```sql
-- Index for fast dashboard sorting by date
CREATE INDEX idx_created_at ON links(created_at DESC);
```

---

## Cloudflare KV (Key-Value)

The `LINKS_KV` namespace is used for the hot path (redirects).

### Structure

| Item | Format | Example |
| :--- | :--- | :--- |
| **Key** | `{slug}` | `twitter` |
| **Value** | `{long_url}` | `https://twitter.com/myprofile` |
| **Metadata** | JSON Object | `{ "id": 123 }` |

*   **Key:** The slug exactly as it appears in the URL.
*   **Value:** The raw destination URL string.
*   **Metadata:** Optional JSON attached to the key, useful for syncing back to D1 ID or storing lightweight flags without a DB lookup.
