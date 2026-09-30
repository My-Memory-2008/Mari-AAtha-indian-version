/**
 * GET /api/shipping?pincode=600001&weight=300
 * Returns available shipping rates from Qikink for a given pincode and weight.
 *
 * Environment variables required:
 *   QIKINK_API_KEY
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
  const url    = new URL(request.url);

  try {
    const resp = await fetch(
      `${QIKINK_BASE}/shipping-rates?${url.searchParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${env.QIKINK_API_KEY}`,
          'Content-Type':  'application/json',
          'Accept':        'application/json',
        },
      }
    );
    const data = await resp.json();
    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: corsHeaders(origin),
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch shipping rates.', detail: err.message }),
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
