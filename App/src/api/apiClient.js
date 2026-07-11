import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, getDevBackendUrl } from './config';

const TOKEN_KEY = 'cscm_auth_token';

async function getAuthToken() {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function buildUrl(path, params) {
  const base = getDevBackendUrl().replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  let url = `${base}${cleanPath}`;
  if (params && typeof params === 'object') {
    const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
    if (entries.length > 0) {
      const qs = entries
        .map(([k, v]) => {
          const value = typeof v === 'object' ? JSON.stringify(v) : String(v);
          return `${encodeURIComponent(k)}=${encodeURIComponent(value)}`;
        })
        .join('&');
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }
  return url;
}

function safeStringifyBody(body) {
  if (body === undefined || body === null) return undefined;
  if (typeof body === 'string') return body;
  try {
    return JSON.stringify(body);
  } catch (err) {
    return undefined;
  }
}

async function parseResponseBody(response) {
  if (response.status === 204) return null;
  const contentType = response.headers.get && response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (err) {
      return null;
    }
  }
  try {
    return await response.text();
  } catch (err) {
    return null;
  }
}

function logNonOk(method, url, status, payload) {
  const ts = new Date().toISOString();
  // eslint-disable-next-line no-console
  console.warn(`[api] ${ts} ${method} ${url} -> ${status} ${JSON.stringify(payload).slice(0, 200)}`);
}

export async function request(method, path, options = {}) {
  const { params, body, headers, timeoutMs, signal: externalSignal } = options;
  const url = buildUrl(path, params);
  const finalHeaders = { ...API_CONFIG.defaultHeaders, ...(headers || {}) };

  // Auto-attach auth token if not already provided
  if (!finalHeaders['Authorization'] && !finalHeaders['authorization']) {
    const token = await getAuthToken();
    if (token) {
      finalHeaders['Authorization'] = `Bearer ${token}`;
    }
  }
  const bodyText = safeStringifyBody(body);

  let finalBody = undefined;
  if (bodyText !== undefined) {
    finalBody = bodyText;
    if (!finalHeaders['Content-Type'] && !finalHeaders['content-type']) {
      finalHeaders['Content-Type'] = 'application/json';
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs || API_CONFIG.timeoutMs);

  if (externalSignal) {
    if (externalSignal.aborted) controller.abort(externalSignal.reason);
    else externalSignal.addEventListener('abort', () => controller.abort(externalSignal.reason));
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: finalBody,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err && (err.name === 'AbortError' || /abort/i.test(err.message || ''));
    return {
      ok: false,
      status: 0,
      message: isTimeout ? `Request timed out after ${timeoutMs || API_CONFIG.timeoutMs}ms` : (err && err.message) || 'Network error',
      payload: null,
      isTimeout,
    };
  }
  clearTimeout(timer);

  const payload = await parseResponseBody(response);
  if (response.ok) {
    return { ok: true, status: response.status, data: payload };
  }
  logNonOk(method, url, response.status, payload);
  return {
    ok: false,
    status: response.status,
    message: `HTTP ${response.status} ${response.statusText || ''}`.trim(),
    payload,
  };
}

export const apiGet = (path, options = {}) => request('GET', path, options);
export const apiPost = (path, options = {}) => request('POST', path, options);
export const apiPut = (path, options = {}) => request('PUT', path, options);
export const apiDelete = (path, options = {}) => request('DELETE', path, options);
export const apiPatch = (path, options = {}) => request('PATCH', path, options);

export async function apiHealth() {
  return request('GET', API_CONFIG.healthPath, { timeoutMs: 5000 });
}
