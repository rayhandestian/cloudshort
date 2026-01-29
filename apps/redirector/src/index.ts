import { Hono } from 'hono';

type Bindings = {
  LINKS_KV: KVNamespace;
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  
  // 1. Try to get from KV (Hot Path)
  const longUrl = await c.env.LINKS_KV.get(slug);

  if (longUrl) {
    // Async analytics update (non-blocking)
    c.executionCtx.waitUntil(
        c.env.DB.prepare('UPDATE links SET clicks = clicks + 1 WHERE slug = ?')
        .bind(slug)
        .run()
        .catch(err => console.error('Analytics update failed:', err))
    );

    return c.redirect(longUrl, 302);
  }

  return c.text('Link not found', 404);
});

export default app;
