/**
 * POST /api/order
 * Receives the customer's cart + shipping details, submits the order to Qikink,
 * and returns the Qikink order ID back to the browser.
 *
 * GET /api/order?id=xxx
 * Tracks an existing order by Qikink order ID.
 *
 * Environment variables required:
 *   QIKINK_API_KEY   — your Qikink API key
 *   QIKINK_USER_ID   — your Qikink store/user ID
 */

const QIKINK_BASE = 'https://qikink.com/api/v1';

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin':  origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

function qikinkHeaders(env) {
  return {
    'Authorization': `Bearer ${env.QIKINK_API_KEY}`,
    'Content-Type':  'application/json',
    'Accept':        'application/json',
  };
}

// POST /api/order  — place a new order
export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin') || '';

  if (!env.QIKINK_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'QIKINK_API_KEY not set.' }),
      { status: 500, headers: corsHeaders(origin) }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Request body must be valid JSON.' }),
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  // Validate the minimum fields we expect from the frontend
  const required = ['items', 'shipping_address', 'customer'];
  for (const field of required) {
    if (!body[field]) {
      return new Response(
        JSON.stringify({ error: `Missing required field: "${field}"` }),
        { status: 400, headers: corsHeaders(origin) }
      );
    }
  }

  // Attach our store ID so Qikink knows which account to bill
  body.user_id = env.QIKINK_USER_ID || body.user_id;

  try {
    const resp = await fetch(`${QIKINK_BASE}/orders`, {
      method:  'POST',
      headers: qikinkHeaders(env),
      body:    JSON.stringify(body),
    });
    const data = await resp.json();
    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: corsHeaders(origin),
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Failed to place order with Qikink.', detail: err.message }),
      { status: 502, headers: corsHeaders(origin) }
    );
  }
}

// GET /api/order?id=QIKINK_ORDER_ID  — track an existing order
export async function onRequestGet({ request, env }) {
  const origin = request.headers.get('Origin') || '';
  const url    = new URL(request.url);
  const id     = url.searchParams.get('id');

  if (!id) {
    return new Response(
      JSON.stringify({ error: 'Missing query param: id' }),
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  try {
    const resp = await fetch(`${QIKINK_BASE}/orders/${id}`, {
      headers: qikinkHeaders(env),
    });
    const data = await resp.json();
    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: corsHeaders(origin),
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch order from Qikink.', detail: err.message }),
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
