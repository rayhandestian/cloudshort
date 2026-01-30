# Deployment Guide

Cloudshort deploys to the Cloudflare network using `wrangler`.

## Prerequisites

- Cloudflare Account (logged in via `wrangler login`)
- [Node.js](https://nodejs.org/) (Latest LTS)
- [pnpm](https://pnpm.io/)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

---

## Quick Deployment

For first-time setup and deployment, run these two commands from the project root:

```bash
# 1. Setup: Creates D1/KV, updates config, initializes DB schema
pnpm run project:setup

# 2. Deploy: Publishes Redirector (Worker) and Dashboard (Pages)
pnpm run project:deploy
```

That's it! For manual configuration or troubleshooting, see below.

---

## Manual Configuration

### 1. Create Cloudflare Resources

If you prefer manual setup over the automated script:

```bash
# Create D1 Database
npx wrangler d1 create cloudshort-db

# Create KV Namespace
npx wrangler kv:namespace create LINKS_KV
```

Take note of the IDs returned by each command.

### 2. Configure `wrangler.toml`

Update `apps/redirector/wrangler.toml` with your resource IDs:

```toml
name = "cloudshort-redirector"
main = "src/index.ts"
compatibility_date = "2024-04-01"

[[kv_namespaces]]
binding = "LINKS_KV"
id = "<YOUR_KV_ID>"

[[d1_databases]]
binding = "DB"
database_name = "cloudshort-db"
database_id = "<YOUR_D1_ID>"
```

### 3. Initialize Database Schema

Apply the database schema to your D1 database:

```bash
npx wrangler d1 execute cloudshort-db --remote --file=./schema.sql --config apps/redirector/wrangler.toml
npx wrangler d1 execute cloudshort-db --remote --file=./schema_analytics.sql --config apps/redirector/wrangler.toml
```

### 4. Configure Secrets

Set the admin password and JWT secret for the Dashboard:

```bash
# Admin login password
npx wrangler pages secret put ADMIN_PASSWORD --project-name cloudshort-dashboard

# JWT signing key (generate with: openssl rand -hex 32)
npx wrangler pages secret put JWT_SECRET --project-name cloudshort-dashboard
```

---

## Deployment

### Redirector (Cloudflare Worker)

```bash
pnpm deploy:redirector
```

### Dashboard (Cloudflare Pages)

**Option A: Manual Deploy**
```bash
pnpm deploy:dashboard
```

**Option B: Git Integration (Recommended)**

Connect your GitHub repo to Cloudflare Pages with:
- **Build Command**: `pnpm build`
- **Build Output Directory**: `dist`
- **Root Directory**: `apps/dashboard`

### Dashboard Bindings

The Dashboard API (Pages Functions) must share the same bindings as the Redirector. Configure these in **Cloudflare Dashboard > Pages > Settings > Functions**:

- **KV Namespace binding**: `LINKS_KV` → same KV ID
- **D1 Database binding**: `DB` → same D1 ID

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `YOUR_KV_ID_HERE` error on deploy | Run `pnpm run project:setup` or manually update `wrangler.toml` |
| Dashboard can't write to KV/D1 | Verify Pages bindings match Redirector bindings |
| Auth not working | Ensure `ADMIN_PASSWORD` and `JWT_SECRET` are set via `wrangler pages secret` |
