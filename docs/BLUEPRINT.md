# ☁️ Project Blueprint: Cloudshort

**Description:** A high-performance, private URL shortener built on the Cloudflare ecosystem, leveraging Workers for low-latency redirects and Pages for a secure, password-protected admin dashboard.
**Target Stack:** Cloudflare Ecosystem (Full)
**Language:** TypeScript

## 1. Executive Summary

**Cloudshort** is a high-performance, private URL shortener.

* **Public Facing:** A "blazing fast" redirect engine running on Cloudflare Workers.
* **Admin Facing:** A private dashboard hosted on Cloudflare Pages (protected by App-Level Auth) to manage links and view analytics.
* **Philosophy:** "Read from Cache (KV), Manage in Truth (D1)."

## 2. Technology Stack (Modern & Future-Proof)

We will use a **Monorepo** structure (using `pnpm workspaces`) to keep the Redirect logic and Admin UI separate but co-located.

* **Package Manager:** `pnpm`
* **Redirect Engine (The Edge):**
* **Runtime:** Cloudflare Workers
* **Framework:** **Hono** (Standard, lightweight, strictly typed).


* **Admin Dashboard (The UI):**
* **Host:** Cloudflare Pages (Single Page App)
* **Framework:** **React** + **Vite**
* **Styling:** Tailwind CSS + `shadcn/ui`.
* **Data Fetching:** TanStack Query (React Query).


* **Data Layer:**
* **Hot Store (Speed):** Cloudflare **KV** (Key-Value). Stores `slug` -> `url`.
* **Cold Store (Metadata):** Cloudflare **D1** (SQLite). Stores analytics, timestamps, tags.
* **Auth:** **Custom JWT Auth**. Application-level authentication using HTTP-only cookies.



---

## 3. Architecture & Data Flow

### A. The "Hybrid" Data Pattern

To achieve sub-50ms redirects while maintaining rich data:

1. **Creation:** Admin creates link -> Writes to **D1** (Master) AND **KV** (Cache).
2. **Redirecting:** User hits `example.com/slug` -> Worker reads **KV** -> Redirects. (0 database hits).
3. **Analytics:** Worker pushes click event to **Workers Analytics Engine** (or D1 via batched writes). *Recommendation: Use Analytics Engine for scale, but D1 `UPDATE` is fine for <10k clicks/day.*

### B. Database Schema (D1)

**Table: `links**`

```sql
CREATE TABLE links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  long_url TEXT NOT NULL,
  created_at INTEGER NOT NULL, -- Unix timestamp
  created_by TEXT,             -- Email from CF Access
  clicks INTEGER DEFAULT 0,    -- Simple counter
  is_active BOOLEAN DEFAULT 1
);

-- Index for fast dashboard sorting
CREATE INDEX idx_created_at ON links(created_at DESC);

```

### C. KV Structure

* **Key:** `slug` (e.g., `twitter`)
* **Value:** `long_url` (e.g., `https://twitter.com/myprofile`)
* **Metadata (Optional):** `{ "id": 123 }` (Used to sync stats later if needed).

---

## 4. Repository Structure

This structure helps us understand boundaries.

```text
/cloudshort
├── pnpm-workspace.yaml
├── package.json
├── README.md
├── BLUEPRINT.md
├── .gitignore
│
├── apps
│   ├── redirector          # (Cloudflare Worker)
│   │   ├── src
│   │   │   └── index.ts    # Hono app for redirects
│   │   ├── wrangler.toml   # Bound to: example.com
│   │   └── package.json
│   │
│   └── dashboard           # (Cloudflare Pages)
│       ├── functions       # Server-side logic for Admin API
│       │   └── api         # [[path]].ts (Hono middleware)
│       ├── src             # React App
│       │   ├── components  # Shadcn UI components
│       │   ├── pages       # Admin views
│       │   └── lib         # Shared types
│       ├── vite.config.ts
│       └── package.json

```

---

## 5. Implementation Details

### A. The Redirector (`apps/redirector`)

* **Goal:** Minimal latency.
* **Logic:**
1. Receive `GET /:slug`.
2. `const url = await env.LINKS_KV.get(slug)`
3. If null -> Return 404 (or custom 404 page).
4. If found -> `ctx.waitUntil` (async analytics) -> Return 301/302 to `url`.


* **Analytics Note:** The `waitUntil` should fire a request to the D1 database to increment the counter: `UPDATE links SET clicks = clicks + 1 WHERE slug = ?`.

### B. The Dashboard (`apps/dashboard`)

* **Goal:** Management.
* **API (via Pages Functions):**
* We will use Hono inside Pages Functions (`functions/api/[[route]].ts`) to act as the backend.
* **Endpoints:**
* `GET /api/links`: List all from D1.
* `POST /api/links`: Validate slug -> Insert D1 -> Put KV.
* `DELETE /api/links/:id`: Delete D1 -> Delete KV.


* **Security:** Middleware checks for valid JWT in `auth_token` cookie. If missing/invalid, redirects to `/login`.



---

## 6. Configuration & Deployment Strategy

### `wrangler.toml` (Redirector)

```toml
name = "cloudshort-redirector"
main = "src/index.ts"
compatibility_date = "2024-04-01"

# Bindings
[[kv_namespaces]]
binding = "LINKS_KV"
id = "<YOUR_KV_ID>"

[[d1_databases]]
binding = "DB"
database_name = "cloudshort-db"
database_id = "<YOUR_D1_ID>"

```

### `wrangler.toml` (Dashboard - Pages)

Pages configuration is mostly done in the dashboard, but we need bindings for the Functions.

* **Bindings:** Must match the Redirector (Same KV ID, Same D1 ID). This allows the Admin panel to write to the same KV that the Redirector reads from.