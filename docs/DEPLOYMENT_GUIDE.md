# Deployment Guide

Cloudshort deploys to the Cloudflare network using `wrangler`.

## Prerequisites

*   Cloudflare Account
*   D1 Database Created
*   KV Namespace Created
### 3. Initialize Database (First Time Only)
Run the following command to apply the database schema (create tables):
```bash
npx wrangler d1 execute cloudshort-db --remote --file=./schema.sql --config apps/dashboard/wrangler.toml
```

### 4. Configure Secrets (First Time Only)
For security, the Admin Dashboard requires an admin password and a secret key for authentication tokens.

```bash
# 1. Set the Admin Password (used to log in)
npx wrangler pages secret put ADMIN_PASSWORD --project-name cloudshort-dashboard

# 2. Set a secure random string for JWT signing (e.g., generated via `openssl rand -hex 32`)
npx wrangler pages secret put JWT_SECRET --project-name cloudshort-dashboard
```

### 5. Deploy to Cloudflare
Run the deployment script to build and deploy both applications:

## 1. Redirector Configuration

The Redirector is a Cloudflare Worker configured via `wrangler.toml`.

### `apps/redirector/wrangler.toml`

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

*   **LINKS_KV**: The ID of the KV namespace for fast lookups.
*   **DB**: The ID of the D1 database for analytics and management.

## 2. Dashboard Configuration

The Dashboard is hosted on Cloudflare Pages.

### Pages Functions Bindings
Since the Dashboard API (Pages Functions) needs to write to the same data sources as the Redirector, it must share the **exact same bindings**.

*   **In Cloudflare Dashboard > Pages > Settings > Functions:**
    *   Add a **KV Namespace binding** named `LINKS_KV` pointing to the same KV ID.
    *   Add a **D1 Database binding** named `DB` pointing to the same D1 ID.

This shared binding allows the Admin panel (Pages) to update the cache (KV) that the Redirector (Worker) reads from.

## Deployment Strategy

1.  **D1 & KV Setup**: Create these resources once via CLI or Dashboard.
    ```bash
    npx wrangler d1 create cloudshort-db
    npx wrangler kv:namespace create LINKS_KV
    ```
    ```
2.  **Redirector**: Deploy the worker.
    ```bash
    # From project root
    pnpm deploy:redirector
    ```
3.  **Dashboard**: Connect your GitHub repo to Cloudflare Pages.
    *   **Build Command**: `pnpm build`
    *   **Build Output Directory**: `dist`
    *   **Root Directory**: `apps/dashboard` (Important: Set this in Pages settings)

### 3. Manual Deployment (Optional)

You can also deploy from your local machine using the root package scripts:

```bash
# Deploy both Redirector and Dashboard (safely)
pnpm run project:deploy
```
