import { Hono } from 'hono';

type Bindings = {
  LINKS_KV: KVNamespace;
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/:slug?', async (c) => { // Make slug optional to catch root
  const slug = c.req.param('slug');

  // 1. Handle Root Path
  if (!slug) {
    const rootUrl = await c.env.LINKS_KV.get('_config:root_url');
    if (rootUrl) {
      return c.redirect(rootUrl, 302);
    }
    return c.text('Cloudshort: No root redirect configured.', 404);
  }

  // 2. Try to get from KV (Hot Path)
  const longUrl = await c.env.LINKS_KV.get(slug);

  if (longUrl) {
    // Async analytics update (non-blocking)
    c.executionCtx.waitUntil(
      (async () => {
        const timestamp = Date.now();
        const country = c.req.raw.cf?.country || 'Unknown';
        const referrer = c.req.header('Referer') || 'Direct';
        const userAgent = c.req.header('User-Agent') || 'Unknown';

        // 1. Update basic counter
        await c.env.DB.prepare('UPDATE links SET clicks = clicks + 1 WHERE slug = ?')
          .bind(slug)
          .run();

        // 2. Log detailed event
        await c.env.DB.prepare(
          'INSERT INTO click_events (slug, timestamp, country, referrer, user_agent) VALUES (?, ?, ?, ?, ?)'
        )
          .bind(slug, timestamp, country, referrer, userAgent)
          .run();
      })().catch(err => console.error('Analytics update failed:', err))
    );

    return c.redirect(longUrl, 302);
  }

  // 3. Handle 404 Fallback
  const notFoundUrl = await c.env.LINKS_KV.get('_config:404_url');
  if (notFoundUrl) {
    return c.redirect(notFoundUrl, 302);
  }

  return c.text('Link not found', 404);
});

export default app;
