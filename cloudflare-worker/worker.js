/**
 * Cloudflare Worker: Gyan Quest Image Proxy
 *
 * Acts as a secure, server-side gateway to Cloudflare Workers AI (@cf/bytedance/stable-diffusion-xl-lightning).
 * Protects credentials (CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID) completely server-side,
 * provides strict CORS for https://gyanquest-edu.web.app, enforces prompt validation,
 * and maintains a 75-second timeout.
 */

const MODEL_NAME = '@cf/bytedance/stable-diffusion-xl-lightning';
const TIMEOUT_MS = 75000;

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/gyanquest-edu\.web\.app$/,
  /^https:\/\/gyanquest-edu\.firebaseapp\.com$/,
  /^http:\/\/localhost:(3000|5173|4173)$/,
  /^https:\/\/.*\.web\.app$/,
  /^https:\/\/.*\.firebaseapp\.com$/,
  /^https:\/\/.*\.run\.app$/,
];

function resolveCorsOrigin(requestOrigin, fallbackOrigin) {
  if (!requestOrigin) {
    return fallbackOrigin || 'https://gyanquest-edu.web.app';
  }
  for (const pattern of ALLOWED_ORIGIN_PATTERNS) {
    if (pattern.test(requestOrigin)) {
      return requestOrigin;
    }
  }
  return fallbackOrigin || 'https://gyanquest-edu.web.app';
}

function getCorsHeaders(requestOrigin, fallbackOrigin) {
  const allowedOrigin = resolveCorsOrigin(requestOrigin, fallbackOrigin);
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Converts ArrayBuffer to Base64 in standard JavaScript without stack overflow.
 */
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

export default {
  async fetch(request, env, ctx) {
    const requestOrigin = request.headers.get('Origin');
    const corsHeaders = getCorsHeaders(requestOrigin, env?.ALLOWED_ORIGIN);

    // 1. Handle CORS Preflight (OPTIONS)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);

    // 2. Health & Verification route (GET / or /health or /verify)
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/health' || url.pathname === '/verify')) {
      const hasAiBinding = Boolean(env?.AI && typeof env.AI.run === 'function');
      const hasApiToken = Boolean(env?.CLOUDFLARE_API_TOKEN && String(env.CLOUDFLARE_API_TOKEN).trim().length > 0);
      const hasAccountId = Boolean(env?.CLOUDFLARE_ACCOUNT_ID && String(env.CLOUDFLARE_ACCOUNT_ID).trim().length > 0);

      return new Response(
        JSON.stringify({
          service: 'gyanquest-image-proxy',
          status: 'online',
          model: MODEL_NAME,
          aiBindingConfigured: hasAiBinding,
          apiTokenConfigured: hasApiToken,
          accountConfigured: hasAccountId,
          corsOrigin: corsHeaders['Access-Control-Allow-Origin'],
          timeoutSeconds: TIMEOUT_MS / 1000,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 3. Image Generation Route (POST)
    if (request.method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON payload. Expected { "prompt": "..." }' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const rawPrompt = body?.prompt;
      if (!rawPrompt || typeof rawPrompt !== 'string' || !rawPrompt.trim()) {
        return new Response(
          JSON.stringify({ error: 'Prompt is required and must be a non-empty string.' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const cleanPrompt = rawPrompt.trim();
      if (cleanPrompt.length < 3 || cleanPrompt.length > 1000) {
        return new Response(
          JSON.stringify({ error: 'Prompt length must be between 3 and 1000 characters.' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Enforce 75-second timeout per provider requirement
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        // Strategy A: Native Workers AI binding (env.AI)
        if (env?.AI && typeof env.AI.run === 'function') {
          const aiResponse = await env.AI.run(MODEL_NAME, {
            prompt: cleanPrompt,
          });

          clearTimeout(timeoutId);

          let arrayBuffer;
          if (aiResponse instanceof ArrayBuffer) {
            arrayBuffer = aiResponse;
          } else if (aiResponse instanceof Uint8Array) {
            arrayBuffer = aiResponse.buffer;
          } else if (aiResponse && typeof aiResponse === 'object' && 'image' in aiResponse && typeof aiResponse.image === 'string') {
            const dataUrl = `data:image/png;base64,${aiResponse.image}`;
            return new Response(
              JSON.stringify({
                imageUrl: dataUrl,
                isAiGenerated: true,
                provider: 'cloudflare',
                model: MODEL_NAME,
              }),
              {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          } else {
            // Stream or standard response body
            const resWrapper = new Response(aiResponse);
            arrayBuffer = await resWrapper.arrayBuffer();
          }

          const base64 = arrayBufferToBase64(arrayBuffer);
          const dataUrl = `data:image/png;base64,${base64}`;

          return new Response(
            JSON.stringify({
              imageUrl: dataUrl,
              isAiGenerated: true,
              provider: 'cloudflare',
              model: MODEL_NAME,
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Strategy B: Cloudflare REST API with Worker secrets (CLOUDFLARE_API_TOKEN)
        const apiToken = (env?.CLOUDFLARE_API_TOKEN || '').trim();
        if (!apiToken) {
          clearTimeout(timeoutId);
          return new Response(
            JSON.stringify({
              error: 'Cloudflare credentials not configured. Please bind Workers AI (env.AI) or set CLOUDFLARE_API_TOKEN in Worker secrets.',
            }),
            {
              status: 503,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        let accountId = (env?.CLOUDFLARE_ACCOUNT_ID || '').trim();
        if (!accountId) {
          // Discover Account ID via token
          const accRes = await fetch('https://api.cloudflare.com/client/v4/accounts', {
            headers: {
              Authorization: `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          });

          if (accRes.ok) {
            const accData = await accRes.json().catch(() => null);
            if (Array.isArray(accData?.result) && accData.result.length > 0 && accData.result[0]?.id) {
              accountId = accData.result[0].id;
            }
          }
        }

        if (!accountId) {
          clearTimeout(timeoutId);
          return new Response(
            JSON.stringify({
              error: 'Cloudflare Account ID could not be identified. Please set CLOUDFLARE_ACCOUNT_ID secret or ensure token has Account Settings Read permissions.',
            }),
            {
              status: 502,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL_NAME}`;
        const cfRes = await fetch(cfUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: cleanPrompt }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!cfRes.ok) {
          const status = cfRes.status;
          return new Response(
            JSON.stringify({
              error: `Cloudflare Image API rejected request (HTTP ${status}).`,
              statusCode: status,
            }),
            {
              status,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const contentType = cfRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await cfRes.json().catch(() => null);
          if (json?.result?.image) {
            const dataUrl = `data:image/png;base64,${json.result.image}`;
            return new Response(
              JSON.stringify({
                imageUrl: dataUrl,
                isAiGenerated: true,
                provider: 'cloudflare',
                model: MODEL_NAME,
              }),
              {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }
        }

        const arrayBuffer = await cfRes.arrayBuffer();
        const base64 = arrayBufferToBase64(arrayBuffer);
        const mime = contentType.includes('jpeg') ? 'image/jpeg' : 'image/png';
        const dataUrl = `data:${mime};base64,${base64}`;

        return new Response(
          JSON.stringify({
            imageUrl: dataUrl,
            isAiGenerated: true,
            provider: 'cloudflare',
            model: MODEL_NAME,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch (err) {
        clearTimeout(timeoutId);
        const isTimeout = err?.name === 'AbortError' || controller.signal.aborted;
        const msg = isTimeout
          ? 'Cloudflare image generation timed out after 75s'
          : 'Failed to generate image via Cloudflare Workers AI.';

        return new Response(
          JSON.stringify({
            error: msg,
            isTimeout,
          }),
          {
            status: isTimeout ? 504 : 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use GET /health or POST /' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  },
};
