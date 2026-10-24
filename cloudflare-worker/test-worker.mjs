import worker from './worker.js';
import assert from 'assert';

console.log('--- Starting Cloudflare Worker Unit Tests ---');

async function runTests() {
  let passed = 0;

  // Test 1: OPTIONS CORS Preflight
  {
    const req = new Request('https://dummy.worker/generate', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://gyanquest-edu.web.app',
        'Access-Control-Request-Method': 'POST',
      },
    });
    const res = await worker.fetch(req, {}, {});
    assert.strictEqual(res.status, 204, 'Preflight should return 204');
    assert.strictEqual(
      res.headers.get('Access-Control-Allow-Origin'),
      'https://gyanquest-edu.web.app',
      'Should reflect allowed origin'
    );
    console.log('✅ Test 1 Passed: CORS OPTIONS Preflight');
    passed++;
  }

  // Test 2: GET /health returns online status and CORS
  {
    const req = new Request('https://dummy.worker/health', {
      method: 'GET',
      headers: { Origin: 'https://gyanquest-edu.web.app' },
    });
    const res = await worker.fetch(req, {}, {});
    assert.strictEqual(res.status, 200, 'Health endpoint should return 200');
    const data = await res.json();
    assert.strictEqual(data.status, 'online', 'Status should be online');
    assert.strictEqual(data.model, '@cf/bytedance/stable-diffusion-xl-lightning');
    console.log('✅ Test 2 Passed: GET /health status check');
    passed++;
  }

  // Test 3: POST with empty prompt rejected with 400
  {
    const req = new Request('https://dummy.worker/generate', {
      method: 'POST',
      headers: {
        Origin: 'https://gyanquest-edu.web.app',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: '   ' }),
    });
    const res = await worker.fetch(req, {}, {});
    assert.strictEqual(res.status, 400, 'Empty prompt should return 400');
    const data = await res.json();
    assert(data.error.includes('Prompt is required'), 'Error message should indicate required prompt');
    console.log('✅ Test 3 Passed: Rejection of empty prompt');
    passed++;
  }

  // Test 4: POST with missing credentials returns 503 without leaking secrets
  {
    const req = new Request('https://dummy.worker/generate', {
      method: 'POST',
      headers: {
        Origin: 'https://gyanquest-edu.web.app',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: 'Ancient Gurukul hermitage under a banyan tree' }),
    });
    const res = await worker.fetch(req, {}, {});
    assert.strictEqual(res.status, 503, 'Missing credentials should return 503');
    const data = await res.json();
    assert(data.error.includes('credentials not configured'), 'Error message must guide user');
    console.log('✅ Test 4 Passed: Safe handling of missing credentials (503)');
    passed++;
  }

  // Test 5: Native Workers AI binding execution mock
  {
    const mockEnv = {
      AI: {
        run: async (model, params) => {
          assert.strictEqual(model, '@cf/bytedance/stable-diffusion-xl-lightning');
          assert.strictEqual(params.prompt, 'Ancient Gurukul hermitage');
          // Mock 4 bytes binary image
          return new Uint8Array([137, 80, 78, 71]).buffer;
        },
      },
    };
    const req = new Request('https://dummy.worker/generate', {
      method: 'POST',
      headers: {
        Origin: 'https://gyanquest-edu.web.app',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: 'Ancient Gurukul hermitage' }),
    });
    const res = await worker.fetch(req, mockEnv, {});
    assert.strictEqual(res.status, 200, 'Mock AI execution should return 200');
    const data = await res.json();
    assert.strictEqual(data.isAiGenerated, true);
    assert.strictEqual(data.provider, 'cloudflare');
    assert(data.imageUrl.startsWith('data:image/png;base64,'));
    console.log('✅ Test 5 Passed: Native Workers AI binding execution');
    passed++;
  }

  console.log(`\n🎉 All ${passed}/5 tests passed successfully!`);
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
