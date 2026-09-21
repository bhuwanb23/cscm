import { authHeaders } from '../state/AuthContext.jsx';

let currentToken = null;
export function setApiToken(token) {
  currentToken = token;
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders(currentToken),
    ...(options.headers || {}),
  };
  const res = await fetch(path, { ...options, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      typeof body.error === 'string'
        ? body.error
        : JSON.stringify(body.error || body);
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return body;
}

export const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data || {}) }),
  patch: (path, data) => request(path, { method: 'PATCH', body: JSON.stringify(data || {}) }),
  put: (path, data) => request(path, { method: 'PUT', body: JSON.stringify(data || {}) }),
  del: (path, data) => request(path, { method: 'DELETE', body: JSON.stringify(data || {}) }),
};

/**
 * Calls through to the Node backend. `path` starts after /api/v1, e.g.
 * callBackend('GET', '/debug/system'). Admin endpoints work when the
 * dashboard signs a backend token (BACKEND_JWT_SECRET configured) or when
 * the user pastes a real admin JWT into Settings.
 */
export function callBackend(method, path, data) {
  const backendToken = sessionStorage.getItem('cp_backend_token') || '';
  return request(`/api${path}`, {
    method,
    body: data ? JSON.stringify(data) : undefined,
    headers: backendToken ? { 'x-backend-token': backendToken } : {},
  });
}

export function callGateway(method, path, data) {
  const backendToken = sessionStorage.getItem('cp_backend_token') || '';
  return request(`/gateway${path}`, {
    method,
    body: data ? JSON.stringify(data) : undefined,
    headers: backendToken ? { 'x-backend-token': backendToken } : {},
  });
}

export function callAiMl(method, path, data) {
  const backendToken = sessionStorage.getItem('cp_backend_token') || '';
  return request(`/api/aiml${path}`, {
    method,
    body: data ? JSON.stringify(data) : undefined,
    headers: backendToken ? { 'x-backend-token': backendToken } : {},
  });
}
