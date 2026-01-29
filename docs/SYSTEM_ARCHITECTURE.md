# System Architecture

## Overview

Cloudshort is designed as a high-performance, private URL shortener leveraging the full Cloudflare ecosystem. It splits responsibilities between a latency-critical Edge Redirector and a secure, feature-rich Admin Dashboard.

## High-Level Design

The system follows a "Read from Cache, Write to Truth" philosophy to ensure sub-50ms redirects while maintaining data integrity.

### Components

1.  **Redirect Engine (The Edge)**
    *   **Runtime:** Cloudflare Workers
    *   **Framework:** Hono (Strictly typed, lightweight)
    *   **Role:** Handles public traffic, reads from KV, performs redirects.

2.  **Admin Dashboard (The UI)**
    *   **Host:** Cloudflare Pages
    *   **Framework:** React + Vite (SPA)
    *   **Styling:** Tailwind CSS + shadcn/ui
    *   **Role:** Secure interface for managing links and viewing analytics.

3.  **Authentication**
    *   **Mechanism:** App-Level Authentication (JWT + Cookies)
    *   **Strategy:** Validates HTTP-only `auth_token` cookie on every API request. managed via `/_middleware.ts` (Pages) or Hono middleware.

## Data Flow: The "Hybrid" Pattern

To achieve optimal performance:

### 1. Link Creation (Write)
When an admin creates a new link via the Dashboard:
1.  Admin submits data to the API.
2.  System writes the "Canonical" record to **D1** (SQLite).
3.  System writes the "Hot" record to **KV** (Key-Value) for edge access.

### 2. Redirection (Read)
When a user visits a short link (`example.com/slug`):
1.  Worker receives the request.
2.  Worker looks up existing `slug` in **KV**.
    *   *Hit:* Returns 301/302 Redirect to the stored URL. (0 DB hits)
    *   *Miss:* Returns 404.

### 3. Analytics
1.  Worker captures the click event.
2.  Data is pushed to **Workers Analytics Engine** (preferred for scale) or batched to **D1** immediately.
    *   *Note:* For lower traffic (<10k/day), a direct D1 `UPDATE` is acceptable.

## Technology Stack Summary

| Component | Technology | Reasoning |
| :--- | :--- | :--- |
| **Monorepo** | `pnpm workspaces` | Co-location of Redirector and Dashboard code. |
| **Edge** | Cloudflare Workers + Hono | Lowest latency, standard API. |
| **Frontend** | React + Vite + TanStack Query | Modern, fast SPA development. |
| **Hot Store** | Cloudflare KV | Extremely fast global reads for redirects. |
| **Cold Store** | Cloudflare D1 (SQLite) | Relational queries for management and stats. |
| **Auth** | Custom JWT + Cookies | Self-contained, portable security. |
