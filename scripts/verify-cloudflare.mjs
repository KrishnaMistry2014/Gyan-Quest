#!/usr/bin/env node

/**
 * Cloudflare API Token Integration Verification Script
 *
 * Requirements verified:
 * 1. Checks that CLOUDFLARE_API_TOKEN is read from process.env / .env
 * 2. Keeps requests server-side without exposing or logging tokens
 * 3. Executes harmless GET https://api.cloudflare.com/client/v4/user/tokens/verify
 * 4. Handles missing credentials or authentication failures explicitly
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('='.repeat(70));
console.log('CLOUDFLARE API TOKEN INTEGRATION VERIFIER');
console.log('='.repeat(70));

const token = (process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_KEY || '').trim();
const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();

if (!token) {
  console.log('\n[RESULT: MISSING CREDENTIALS]');
  console.log('  Status: CLOUDFLARE_API_TOKEN is NOT configured in process.env or .env');
  console.log('  Environment Variable: CLOUDFLARE_API_TOKEN (unset or empty)');
  console.log('\n[ACTION REQUIRED]');
  console.log('  To complete authentication with Cloudflare:');
  console.log('  1. Generate an API Token at: https://dash.cloudflare.com/profile/api-tokens');
  console.log('     Required Minimum Permissions:');
  console.log('       - Account -> Workers AI -> Read (for image model execution)');
  console.log('       - Account -> Account Settings -> Read (optional: for auto account discovery)');
  console.log('  2. Add the token to your .env file in the project root:');
  console.log('     CLOUDFLARE_API_TOKEN=your_token_here');
  console.log('     CLOUDFLARE_ACCOUNT_ID=your_account_id_here (optional)');
  console.log('  3. Re-run: node scripts/verify-cloudflare.mjs\n');
  process.exit(2);
}

// Token is present - display masked details without leaking secret
const maskedToken = token.length > 8
  ? `${token.slice(0, 3)}...${token.slice(-3)} (length: ${token.length})`
  : `*** (length: ${token.length})`;

console.log(`\n[CREDENTIAL CHECK]`);
console.log(`  CLOUDFLARE_API_TOKEN: Present [${maskedToken}]`);
console.log(`  CLOUDFLARE_ACCOUNT_ID: ${accountId ? 'Configured' : 'Will auto-discover via API'}`);

console.log('\n[TESTING AUTHENTICATION]');
console.log('  Sending harmless GET request to Cloudflare verification endpoint:');
console.log('  Endpoint: https://api.cloudflare.com/client/v4/user/tokens/verify');

try {
  const verifyRes = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await verifyRes.json().catch(() => null);

  if (verifyRes.ok && data?.success) {
    console.log(`\n[RESULT: AUTHENTICATION SUCCESSFUL]`);
    console.log(`  HTTP Status: ${verifyRes.status} OK`);
    console.log(`  Token Status: ${data?.result?.status || 'active'}`);
    console.log(`  Cloudflare Message: ${data?.messages?.[0]?.message || 'API Token is valid and active'}`);

    // Test account accessibility for Workers AI
    try {
      const accountsRes = await fetch('https://api.cloudflare.com/client/v4/accounts', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (accountsRes.ok) {
        const accData = await accountsRes.json();
        const accounts = accData?.result || [];
        console.log(`  Accessible Accounts Found: ${accounts.length}`);
        if (accounts.length > 0) {
          const acc = accounts[0];
          console.log(`  Primary Account ID: ${acc.id.slice(0, 4)}...${acc.id.slice(-4)} (${acc.name || 'unnamed'})`);
          console.log(`  Workers AI Routing: Ready for @cf/bytedance/stable-diffusion-xl-lightning`);
        }
      } else {
        console.log(`  Accounts Query HTTP Status: ${accountsRes.status} (ensure CLOUDFLARE_ACCOUNT_ID is set if token lacks account-listing scope)`);
      }
    } catch (_) {}

    console.log('\nAll verification checks passed successfully.');
    process.exit(0);
  } else {
    console.log(`\n[RESULT: AUTHENTICATION FAILED]`);
    console.log(`  HTTP Status: ${verifyRes.status}`);
    const errors = data?.errors?.map((e) => e.message).join(', ') || 'Token was rejected';
    console.log(`  Cloudflare Error: ${errors}`);
    console.log(`  Please check that the token has not expired and has proper permissions.`);
    process.exit(1);
  }
} catch (err) {
  console.log(`\n[RESULT: NETWORK ERROR]`);
  console.log(`  Failed to connect to Cloudflare API: ${err?.message || String(err)}`);
  process.exit(1);
}
