# API Reference

This document outlines the interfaces for the Redirector (Public) and the Dashboard (Admin).

## 1. Redirector API (Public)

The core redirection engine running on Cloudflare Workers.

### Get Redirect
Retrieves the long URL for a given slug and performs a 301/302 redirect.

- **Endpoint:** `GET /:slug`
- **Response:**
    - `301/302`: Redirects to the `long_url`.
    - `404`: Returns a 404 error page if the slug does not exist in KV.
- **Side Effects:**
    - Triggers an asynchronous analytics update (increments click count in D1 or Analytics Engine).

---

## 2. Admin API (Private)

Backend logic hosted on Cloudflare Pages Functions (`functions/api/[[route]].ts`).
All endpoints require valid Application-Level Authentication.

### Authentication
**Header:** `Cookie: auth_token=...` or `Authorization: Bearer <token>`
*   The API middleware validates the JWT token.
*   If missing or invalid, the request is rejected (401 Unauthorized).

### Endpoints

#### List Links
Retrieves a paginated list of created short links.

- **Endpoint:** `GET /api/links`
- **Source:** D1 (`links` table)
- **Response:** JSON array of link objects.

#### Create Link
Creates a new short link. Write to both D1 and KV.

- **Endpoint:** `POST /api/links`
- **Body:**
  ```json
  {
    "slug": "twitter",
    "long_url": "https://twitter.com/myprofile"
  }
  ```
- **Process:**
    1.  Validate input.
    2.  Insert into D1 (`links` table).
    3.  Put into KV (`slug` -> `long_url`).
- **Response:** `201 Created` with the new link object.

#### Delete Link
Removes a link from the system.

- **Endpoint:** `DELETE /api/links/:id`
- **Params:** `id` (The database ID of the link)
- **Process:**
    1.  Lookup link in D1 to get the slug.
    2.  Delete from D1.
    3.  Delete from KV using the retrieved slug.
- **Response:** `200 OK` or `204 No Content`.
