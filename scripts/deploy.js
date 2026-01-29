const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REDIRECTOR_CONFIG_PATH = path.join(__dirname, '../apps/redirector/wrangler.toml');

function checkConfig() {
    console.log('🔍 Checking configuration...');

    if (!fs.existsSync(REDIRECTOR_CONFIG_PATH)) {
        console.error(`❌ Error: Could not find ${REDIRECTOR_CONFIG_PATH}`);
        process.exit(1);
    }

    const content = fs.readFileSync(REDIRECTOR_CONFIG_PATH, 'utf-8');

    // Check for placeholders
    if (content.includes('YOUR_KV_ID_HERE') || content.includes('YOUR_D1_ID_HERE')) {
        console.error('❌ Error: Deployment failed.');
        console.error('   You must update apps/redirector/wrangler.toml with your actual Cloudflare KV and D1 IDs.');
        console.error('   See docs/DEVELOPMENT.md for instructions.');
        process.exit(1);
    }

    console.log('✅ Configuration looks valid.');
}

function deploy() {
    try {
        console.log('\n🚀 Deploying Redirector...');
        execSync('pnpm deploy:redirector', { stdio: 'inherit' });

        console.log('\n🚀 Deploying Dashboard...');
        execSync('pnpm deploy:dashboard', { stdio: 'inherit' });

        console.log('\n✅ Deployment Complete!');
    } catch (error) {
        console.error('\n❌ Deployment failed.');
        process.exit(1);
    }
}

// Main execution
checkConfig();
deploy();
