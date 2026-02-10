// Shared utilities for all API functions

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

export function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = [
    'https://conciencia-encarnada.pages.dev',
    'http://localhost:5173',
    'http://localhost:4173',
  ];

  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (allowedOrigins.includes(origin) || origin.endsWith('.conciencia-encarnada.pages.dev')) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

export function handleCors(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request),
    });
  }
  return null;
}

export function requireAdmin(request, env) {
  const auth = request.headers.get('Authorization') || '';
  if (auth !== `Bearer ${env.ADMIN_SECRET}`) {
    return jsonResponse({ error: 'No autorizado' }, 401);
  }
  return null;
}

export async function callClaudeAPI(prompt, env) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    console.error('Claude API error:', response.status, await response.text());
    return null;
  }

  const data = await response.json();
  return data.content?.[0]?.text || null;
}

export function addCorsHeaders(response, request) {
  const newHeaders = new Headers(response.headers);
  const cors = corsHeaders(request);
  for (const [key, value] of Object.entries(cors)) {
    newHeaders.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  });
}
