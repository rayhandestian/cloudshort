import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { sign, verify } from 'hono/jwt';
import { setCookie, getCookie } from 'hono/cookie';

type Bindings = {
    LINKS_KV: KVNamespace;
    DB: D1Database;
    ADMIN_PASSWORD?: string;
    JWT_SECRET?: string;
};

const app = new Hono<{ Bindings: Bindings }>().basePath('/api');

// Login Endpoint
app.post('/login', async (c) => {
    const { password } = await c.req.json();
    const adminPassword = c.env.ADMIN_PASSWORD;

    if (!adminPassword) {
        return c.json({ error: 'Server configuration error: ADMIN_PASSWORD not set' }, 500);
    }

    if (password !== adminPassword) {
        return c.json({ error: 'Invalid password' }, 401);
    }

    const jwtSecret = c.env.JWT_SECRET;
    if (!jwtSecret) {
        return c.json({ error: 'Server configuration error: JWT_SECRET not set' }, 500);
    }

    const token = await sign({ role: 'admin', exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, jwtSecret, 'HS256');

    // Set HTTP-only cookie for security
    setCookie(c, 'auth_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        path: '/',
        maxAge: 60 * 60 * 24,
    });

    return c.json({ success: true });
});

app.post('/logout', (c) => {
    setCookie(c, 'auth_token', '', { maxAge: 0, path: '/' });
    return c.json({ success: true });
});

// Middleware: Verify JWT
app.use('*', async (c, next) => {
    if (c.req.path === '/api/login' || c.req.path === '/api/auth/check') {
        await next();
        return;
    }

    const token = getCookie(c, 'auth_token');

    if (!token) return c.json({ error: 'Unauthorized: No token provided' }, 401);

    const jwtSecret = c.env.JWT_SECRET;
    if (!jwtSecret) return c.json({ error: 'Server configuration error: Missing JWT_SECRET' }, 500);

    try {
        await verify(token, jwtSecret, 'HS256');
        await next();
    } catch (e: any) {
        return c.json({ error: 'Unauthorized: Invalid token', details: e.message }, 401);
    }
});

// Auth Check Helper
app.get('/auth/check', async (c) => {
    const token = getCookie(c, 'auth_token');
    const jwtSecret = c.env.JWT_SECRET;
    if (!token || !jwtSecret) return c.json({ authenticated: false });
    try {
        await verify(token, jwtSecret, 'HS256');
        return c.json({ authenticated: true });
    } catch {
        return c.json({ authenticated: false });
    }
});

app.get('/links', async (c) => {
    const { results } = await c.env.DB.prepare('SELECT * FROM links ORDER BY created_at DESC').all();
    return c.json(results);
});

app.post('/links', async (c) => {
    const { slug, long_url } = await c.req.json();

    if (!slug || !long_url) return c.json({ error: 'Missing slug or long_url' }, 400);

    // Todo: Handle unique constraint error
    try {
        await c.env.DB.prepare('INSERT INTO links (slug, long_url, created_at) VALUES (?, ?, ?)')
            .bind(slug, long_url, Date.now())
            .run();

        await c.env.LINKS_KV.put(slug, long_url);

        return c.json({ success: true }, 201);
    } catch (e: any) {
        // Handle duplicate slug error
        if (e.message.includes('SQLITE_CONSTRAINT')) {
            return c.json({ error: 'Slug already taken', details: { slug } }, 409);
        }

        return c.json({
            error: 'Failed to create link',
            details: {
                message: e.message,
                stack: e.stack,
                name: e.name
            }
        }, 500);
    }
});

app.delete('/links/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const link = await c.env.DB.prepare('SELECT slug FROM links WHERE id = ?').bind(id).first<{ slug: string }>();

        if (!link) return c.json({ error: 'Link not found' }, 404);

        await c.env.DB.prepare('DELETE FROM links WHERE id = ?').bind(id).run();
        await c.env.LINKS_KV.delete(link.slug);

        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: 'Failed to delete link', details: e.message }, 500);
    }
});

// Settings Endpoints
app.get('/settings', async (c) => {
    try {
        const rootUrl = await c.env.LINKS_KV.get('_config:root_url');
        const notFoundUrl = await c.env.LINKS_KV.get('_config:404_url');
        return c.json({ root_url: rootUrl || '', not_found_url: notFoundUrl || '' });
    } catch (e: any) {
        return c.json({ error: 'Failed to fetch settings', details: e.message }, 500);
    }
});

app.post('/settings', async (c) => {
    try {
        const { root_url, not_found_url } = await c.req.json();

        if (typeof root_url === 'string') {
            await c.env.LINKS_KV.put('_config:root_url', root_url);
        }
        if (typeof not_found_url === 'string') {
            await c.env.LINKS_KV.put('_config:404_url', not_found_url);
        }

        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: 'Failed to update settings', details: e.message }, 500);
    }
});

export const onRequest = handle(app);
