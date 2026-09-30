/**
 * GET /api/products
 * Fetches the product catalogue from Qikink and returns it to the browser.
 * Cloudflare Pages Function — runs on Cloudflare's edge, never in the browser.
 *
 * Environment variable required (set in Cloudflare Pages dashboard):
 *   QIKINK_API_KEY   — your Qikink API key
 *   QIKINK_USER_ID   — your Qikink User/Store ID (some endpoints need this)
 */

const QIKINK_BASE = 'https://qikink.com/api/v1';

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin':  origin || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

export async function onRequestGet({ request, env }) {
  const origin = request.headers.get('Origin') || '';

  if (!env.QIKINK_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'QIKINK_API_KEY not set in environment.' }),
      { status: 500, headers: corsHeaders(origin) }
    );
  }

  try {
    const resp = await fetch(`${QIKINK_BASE}/products`, {
      headers: {
        'Authorization': `Bearer ${env.QIKINK_API_KEY}`,
        'Content-Type':  'application/json',
        'Accept':        'application/json',
      },
    });

    const data = await resp.json();
    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: corsHeaders(origin),
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Failed to reach Qikink API.', detail: err.message }),
      { status: 502, headers: corsHeaders(origin) }
    );
  }
}

// Handle CORS preflight
export async function onRequestOptions({ request }) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('Origin') || ''),
  });
}
