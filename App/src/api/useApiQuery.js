import { useCallback, useEffect, useRef, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './apiClient';
import { resolveCall, lookupEndpoint } from './endpoints';

export function callApi(method, path, options) {
  switch (method) {
    case 'GET':
      return apiGet(path, options);
    case 'POST':
      return apiPost(path, options);
    case 'PUT':
      return apiPut(path, options);
    case 'PATCH':
      return apiPatch(path, options);
    case 'DELETE':
      return apiDelete(path, options);
    default:
      return Promise.resolve({ ok: false, status: 0, message: `Unsupported method ${method}`, payload: null });
  }
}

export function stableStringify(value) {
  if (value === undefined || value === null) return '';
  try {
    return JSON.stringify(value, Object.keys(value).sort());
  } catch (err) {
    return String(Date.now());
  }
}

export function buildQueryParams(endpoint, params) {
  if (!endpoint.queryParams || endpoint.queryParams.length === 0) return undefined;
  const out = {};
  endpoint.queryParams.forEach((name) => {
    if (params && params[name] !== undefined) out[name] = params[name];
  });
  return Object.keys(out).length > 0 ? out : undefined;
}

export function buildBody(endpoint, params, explicitBody) {
  if (explicitBody !== undefined) return explicitBody;
  if (endpoint.method === 'GET' || endpoint.method === 'DELETE') return undefined;
  if (!params) return undefined;
  const excluded = new Set();
  if (endpoint.pathParams) {
    endpoint.pathParams.forEach((p) => excluded.add(p.source || p.name));
  }
  if (endpoint.queryParams) {
    endpoint.queryParams.forEach((name) => excluded.add(name));
  }
  const body = {};
  Object.keys(params).forEach((key) => {
    if (!excluded.has(key)) body[key] = params[key];
  });
  return Object.keys(body).length > 0 ? body : undefined;
}

export function useApiQuery(family, action, options = {}) {
  const { params, body, refetchInterval, enabled = true, onSuccess, onError } = options;
  const endpoint = lookupEndpoint(family, action);
  const [state, setState] = useState({
    data: null,
    loading: enabled && !!endpoint,
    error: null,
    lastFetchedAt: null,
  });
  const controllerRef = useRef(null);
  const paramsKey = stableStringify(params) + '|' + stableStringify(body);

  const run = useCallback(async () => {
    if (!endpoint) {
      setState({ data: null, loading: false, error: `Unknown endpoint ${family}.${action}`, lastFetchedAt: null });
      return;
    }
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    let resolved;
    try {
      resolved = resolveCall(family, action, params);
    } catch (err) {
      setState({ data: null, loading: false, error: err.message, lastFetchedAt: null });
      return;
    }
    const queryParams = buildQueryParams(endpoint, params);
    const finalBody = buildBody(endpoint, params, body);
    const response = await callApi(resolved.method, resolved.path, {
      params: queryParams,
      body: finalBody,
      signal: controller.signal,
    });
    if (controller.signal.aborted) return;
    if (response.ok) {
      setState({ data: response.data, loading: false, error: null, lastFetchedAt: Date.now() });
      if (onSuccess) {
        try { onSuccess(response.data); } catch (e) { }
      }
    } else {
      setState({ data: null, loading: false, error: response, lastFetchedAt: null });
      if (onError) {
        try { onError(response); } catch (e) { }
      }
    }
  }, [family, action, paramsKey, endpoint]);

  useEffect(() => {
    if (!enabled) {
      setState((prev) => ({ ...prev, loading: false }));
      return undefined;
    }
    run();
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
    };
  }, [enabled, run]);

  useEffect(() => {
    if (!enabled || !refetchInterval || refetchInterval <= 0) return undefined;
    const id = setInterval(() => { run(); }, refetchInterval);
    return () => clearInterval(id);
  }, [enabled, refetchInterval, run]);

  const refetch = useCallback(() => run(), [run]);

  return { data: state.data, loading: state.loading, error: state.error, lastFetchedAt: state.lastFetchedAt, refetch };
}
