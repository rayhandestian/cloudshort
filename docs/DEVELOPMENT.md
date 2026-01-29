# Development Guide

## Repository Structure

Cloudshort uses a Monorepo structure managed by `pnpm workspaces` to separate concerns while sharing context.

```text
/cloudshort
├── pnpm-workspace.yaml
├── package.json
├── docs/                   # Documentation (You are here)
│
├── apps
│   ├── redirector          # (Cloudflare Worker) - The Public Edge
│   │   ├── src/index.ts    # Hono app
│   │   └── wrangler.toml   # Worker Config
│   │
│   └── dashboard           # (Cloudflare Pages) - The Admin UI
│       ├── functions       # Server-side Admin API
│       └── src             # React Admin App
```

## Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (Latest LTS)
*   [pnpm](https://pnpm.io/)
*   [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm install -g wrangler`)

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    pnpm install
    ```

### 2. Configure Cloudflare Resources

We have provided a setup script to automate the creation of the D1 Database and KV Namespace, and to update your configuration files.

**Run the Setup Script:**
```bash
pnpm run project:setup
```

*This script will:*
1.  Check for `cloudshort-db` and `LINKS_KV` (creating them if missing).
2.  Update `apps/redirector/wrangler.toml` with the correct IDs.
3.  Initialize the database schema.

### 3. Local Development

#### Redirector
Navigate to `apps/redirector` and run:
```bash
pnpm dev
# or
npx wrangler dev
```

#### Dashboard
Navigate to `apps/dashboard` and run:
```bash
pnpm dev
# Starts Vite dev server + Pages Functions emulation
```

### Philosophy
*   **Edge First**: Logic should run as close to the user as possible.
*   **Type Safety**: Use TypeScript everywhere.
*   **Separation**: Keep the "Hot Path" (Redirector) extremely lightweight.
