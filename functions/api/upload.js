/**
 * POST /api/upload
 * Accepts a base64-encoded design image from the browser,
 * uploads it to Qikink's file storage, and returns the hosted image URL.
 * That URL is then used when placing the order.
 *
 * Body (JSON):
 *   { "image": "data:image/png;base64,iVBOR..." }
 *
 * Environment variables required:
 *   QIKINK_API_KEY
 */

const QIKINK_BASE = 'https://qikink.com/api/v1';

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin':  origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin') || '';

  let body;
  try { body = await request.json(); }
  catch {
    return new Response(
      JSON.stringify({ error: 'Body must be JSON with an "image" field.' }),
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  if (!body.image) {
    return new Response(
      JSON.stringify({ error: 'Missing "image" field (base64 data URL).' }),
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  // Strip the data URL prefix to get raw base64
  const base64 = body.image.replace(/^data:image\/\w+;base64,/, '');

  try {
    const resp = await fetch(`${QIKINK_BASE}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.QIKINK_API_KEY}`,
        'Content-Type':  'application/json',
        'Accept':        'application/json',
      },
      body: JSON.stringify({ file: base64, filename: `design-${Date.now()}.png` }),
    });
    const data = await resp.json();
    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: corsHeaders(origin),
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Failed to upload design to Qikink.', detail: err.message }),
      { status: 502, headers: corsHeaders(origin) }
    );
  }
}

export async function onRequestOptions({ request }) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('Origin') || ''),
  });
}
