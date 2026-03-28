const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const repoRoot = path.resolve(__dirname, '..');
const envPath = path.join(repoRoot, '.env');
const outputPath = path.join(repoRoot, 'electron', 'config.default.json');

const parsed = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};
const preferHostedApi = String(parsed.PREFER_HOSTED_API || '').toLowerCase() === 'true';

const runtimeConfig = {
  apiBaseUrl: parsed.API_BASE_URL || '',
  preferHostedApi,
  databaseUrl: preferHostedApi ? '' : (parsed.DATABASE_URL || ''),
  claudeApiKey: preferHostedApi ? '' : (parsed.CLAUDE_API_KEY || ''),
  port: parsed.PORT || '3000',
  defaultAdminUsername: parsed.DEFAULT_ADMIN_USERNAME || 'admin',
  defaultAdminPassword: parsed.DEFAULT_ADMIN_PASSWORD || 'janwari2024',
  generatedAt: new Date().toISOString(),
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(runtimeConfig, null, 2)}\n`, 'utf8');

console.log(`Prepared runtime config at ${outputPath}`);
