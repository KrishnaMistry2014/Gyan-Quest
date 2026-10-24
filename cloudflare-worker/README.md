# Gyan Quest Cloudflare Worker Image Proxy

This Cloudflare Worker provides a secure, server-side gateway to Cloudflare Workers AI (`@cf/bytedance/stable-diffusion-xl-lightning`) for the Firebase-hosted frontend (`https://gyanquest-edu.web.app`).

---

## 🔒 Security Architecture
- **Tokens are NEVER in the frontend**: The Firebase client only sends `{ prompt: "..." }` to this Worker.
- **Workers AI Native Binding or Secrets**: Uses `[ai]` binding natively, or `CLOUDFLARE_API_TOKEN` & `CLOUDFLARE_ACCOUNT_ID` stored exclusively as Worker secrets.
- **Strict CORS**: Authorized for `https://gyanquest-edu.web.app` (plus local development ports `localhost:3000` / `localhost:5173`).
- **Prompt Validation**: Validates prompt length (3–1000 characters) and strips extraneous whitespace.
- **75-Second Timeout**: Honors the multi-provider 75-second timeout requirement.

---

## 🚀 Deployment Instructions

### Option 1: Native Workers AI Binding (Recommended - No API Token Required!)
Cloudflare Workers can run Workers AI models natively without generating or managing REST API tokens:

```bash
cd cloudflare-worker
npx wrangler login
npx wrangler deploy
```

That's it! `wrangler.toml` already specifies:
```toml
[ai]
binding = "AI"
```
Cloudflare automatically handles model execution permissions under your Cloudflare account.

---

### Option 2: Using API Token & Account ID as Worker Secrets
If you prefer using an explicit Cloudflare API Token:

1. **Deploy the Worker**:
   ```bash
   cd cloudflare-worker
   npx wrangler login
   npx wrangler deploy
   ```

2. **Add Secrets to the Worker** (These are stored encrypted on Cloudflare's servers):
   ```bash
   # Set your Cloudflare API Token (requires Workers AI Read/Edit permissions):
   npx wrangler secret put CLOUDFLARE_API_TOKEN

   # (Optional) Set your Cloudflare Account ID:
   npx wrangler secret put CLOUDFLARE_ACCOUNT_ID
   ```
   *(Note: If `CLOUDFLARE_ACCOUNT_ID` is omitted, the Worker will auto-discover it via the token).*

---

## 🌐 Connecting to the Frontend

Once deployed, Cloudflare Wrangler will print your Worker URL:
```text
Published gyanquest-image-proxy (1.23 sec)
  https://gyanquest-image-proxy.<your-subdomain>.workers.dev
```

Add this URL to your environment variables or deployment configuration:
```env
VITE_CLOUDFLARE_WORKER_URL=https://gyanquest-image-proxy.<your-subdomain>.workers.dev
```

Rebuild and deploy your frontend:
```bash
npm run build
firebase deploy --only hosting
```
