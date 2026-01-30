# Cloudshort

**Cloudshort** is a high-performance, private URL shortener built on the [Cloudflare](https://www.cloudflare.com/) ecosystem. It leverages **Cloudflare Workers** (using [Hono](https://hono.dev/)) for sub-50ms redirects and **Cloudflare Pages** for a secure, password-protected Admin Dashboard.

## 🚀 Features

*   **⚡ Blazing Fast Redirects**: Powered by Cloudflare Workers & KV (Edge).
*   **🔒 Secure Admin Panel**: Protected by Application-Level Authentication (JWT/Cookies).
*   **📊 Analytics**: Tracks clicks and stores metadata in D1 (SQLite).
*   **🛠️ Monorepo**: Managed with `pnpm workspaces`.

## 📂 Repository Structure

*   [`apps/redirector`](apps/redirector): The public-facing Worker handling redirects.
*   [`apps/dashboard`](apps/dashboard): The Admin UI (React + Vite + Pages Functions).
*   [`docs/`](docs/): Detailed documentation.

## 🛠️ Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (Latest LTS)
*   [pnpm](https://pnpm.io/)
*   [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### Installation

```bash
git clone https://github.com/rayhan/cloudshort.git
cd cloudshort
pnpm install
```

### Configuration & Deployment

Please refer to the [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) and [Development Guide](docs/DEVELOPMENT.md) for detailed setup instructions.

**Quick Start:**
```bash
pnpm run project:setup   # Creates D1/KV, configures wrangler.toml, initializes DB
pnpm run project:deploy  # Deploys Redirector (Worker) and Dashboard (Pages)
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
