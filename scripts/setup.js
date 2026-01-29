const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TOML_PATH = path.join(__dirname, '../apps/redirector/wrangler.toml');
const DB_NAME = 'cloudshort-db';
const KV_NAME = 'LINKS_KV';

function run(cmd, ignoreError = false) {
    try {
        return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    } catch (e) {
        if (!ignoreError) {
            console.error(`Command failed: ${cmd}`);
            if (e.stderr) console.error(e.stderr.toString());
        }
        return null;
    }
}

function parseJson(str) {
    if (!str) return null;
    try {
        // Attempt clean parse
        return JSON.parse(str);
    } catch (e) {
        // Attempt to find array [ ... ]
        const start = str.indexOf('[');
        const end = str.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
            try {
                return JSON.parse(str.substring(start, end + 1));
            } catch (e2) { }
        }
        return null;
    }
}

function getD1Id() {
    console.log('🔍 Checking D1 Database...');
    let listJson = run('npx wrangler d1 list --json', true);

    if (listJson) {
        const list = parseJson(listJson);
        if (list) {
            const existing = list.find(db => db.name === DB_NAME);
            if (existing) {
                console.log(`✅ Found existing D1 Database: ${existing.uuid}`);
                return existing.uuid;
            }
        }
    }

    console.log('✨ Creating D1 Database...');
    run(`npx wrangler d1 create ${DB_NAME}`, true); // Ignore error if exists

    // Check again
    listJson = run('npx wrangler d1 list --json');
    if (listJson) {
        const list = parseJson(listJson);
        if (list) {
            const newDb = list.find(db => db.name === DB_NAME);
            if (newDb) return newDb.uuid;
        }
    }
    return null;
}

function getKvId() {
    console.log('🔍 Checking KV Namespace...');
    let listJson = run('npx wrangler kv:namespace list', true); // Removed --json

    if (listJson) {
        const list = parseJson(listJson);
        if (list) {
            // Matches "worker-LINKS_KV" or just "LINKS_KV"
            const existing = list.find(kv => kv.title.includes(KV_NAME));
            if (existing) {
                console.log(`✅ Found existing KV Namespace: ${existing.id}`);
                return existing.id;
            }
        }
    }

    console.log('✨ Creating KV Namespace...');
    run(`npx wrangler kv:namespace create ${KV_NAME}`, true); // Ignore error if exists

    listJson = run('npx wrangler kv:namespace list'); // Removed --json
    if (listJson) {
        const list = parseJson(listJson);
        if (list) {
            const newKv = list.find(kv => kv.title.includes(KV_NAME));
            if (newKv) return newKv.id;
        }
    }
    return null;
}

function updateToml(d1Id, kvId) {
    console.log('📝 Updating wrangler.toml...');
    if (!fs.existsSync(TOML_PATH)) {
        console.error(`❌ Error: Could not find ${TOML_PATH}`);
        return;
    }

    let content = fs.readFileSync(TOML_PATH, 'utf-8');
    let updated = false;

    if (content.includes('YOUR_KV_ID_HERE')) {
        content = content.replace('YOUR_KV_ID_HERE', kvId);
        updated = true;
    }

    if (content.includes('YOUR_D1_ID_HERE')) {
        content = content.replace('YOUR_D1_ID_HERE', d1Id);
        updated = true;
    }

    if (updated) {
        fs.writeFileSync(TOML_PATH, content);
        console.log('✅ wrangler.toml updated.');
    } else {
        console.log('ℹ️  No placeholders found in wrangler.toml (already configured?).');
    }
}

function initDb() {
    console.log('🏗️  Initializing Database Schema...');
    try {
        // Using IF NOT EXISTS to be safe for re-runs
        const schema = `
            CREATE TABLE IF NOT EXISTS links (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                slug TEXT UNIQUE NOT NULL, 
                long_url TEXT NOT NULL, 
                created_at INTEGER NOT NULL, 
                created_by TEXT, 
                clicks INTEGER DEFAULT 0, 
                is_active BOOLEAN DEFAULT 1
            ); 
            CREATE INDEX IF NOT EXISTS idx_created_at ON links(created_at DESC);
        `.replace(/\n/g, ' '); // simple minify

        execSync(`npx wrangler d1 execute ${DB_NAME} --config apps/redirector/wrangler.toml --command "${schema}"`, { stdio: 'inherit' });
        console.log('✅ Database initialized.');
    } catch (e) {
        console.warn('⚠️  Warning: Database initialization encountered an issue (check output above).');
    }
}

async function main() {
    console.log('🚀 Starting Cloudshort Setup...\n');

    try {
        const d1Id = getD1Id();
        if (!d1Id) throw new Error('Failed to retrieve D1 Database ID.');

        const kvId = getKvId();
        if (!kvId) throw new Error('Failed to retrieve KV Namespace ID.');

        updateToml(d1Id, kvId);
        initDb();

        console.log('\n✨ Setup Complete! You can now run:');
        console.log('   pnpm dev:redirector  (to test locally)');
        console.log('   pnpm deploy          (to deploy to Cloudflare)');
    } catch (e) {
        console.error('\n❌ Setup Failed:', e.message);
        process.exit(1);
    }
}

main();
