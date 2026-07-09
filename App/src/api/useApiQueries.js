import { useCallback, useEffect, useRef, useState } from 'react';
import { callApi, stableStringify, buildQueryParams, buildBody } from './useApiQuery';
import { lookupEndpoint, resolveCall } from './endpoints';

function deriveKey(config, index) {
  const opts = config.options || {};
  return `${config.family}.${config.action}|${index}|${stableStringify(opts.params)}|${stableStringify(opts.body)}|${opts.enabled !== false}`;
}

function runOne(config, index, signal) {
  const opts = config.options || {};
  const enabled = opts.enabled !== false;
  if (!enabled) return Promise.resolve({ data: null, loading: false, error: null, _skip: true });

  let endpoint, resolved;
  try {
    endpoint = lookupEndpoint(config.family, config.action);
    resolved = resolveCall(config.family, config.action, opts.params);
  } catch (err) {
    return Promise.resolve({ data: null, loading: false, error: err.message });
  }

  const queryParams = buildQueryParams(endpoint, opts.params);
  const finalBody = buildBody(endpoint, opts.params, opts.body);

  return callApi(resolved.method, resolved.path, {
    params: queryParams,
    body: finalBody,
    signal,
  }).then((response) => {
    if (signal.aborted) return { _aborted: true };
    if (response.ok) return { data: response.data, loading: false, error: null };
    return { data: null, loading: false, error: response };
  }).catch((err) => {
    if (err && (err.name === 'AbortError' || /abort/i.test(err.message || ''))) return { _aborted: true };
    return { data: null, loading: false, error: err && err.message ? err.message : String(err) };
  });
}

export function useApiQueries(queryConfigs = []) {
  const configKey = queryConfigs.map((c, i) => deriveKey(c, i)).join('||');
  const controllerRef = useRef(null);
  const mountedRef = useRef(true);

  const [state, setState] = useState(() => {
    const results = queryConfigs.map((c) => {
      const enabled = (c.options || {}).enabled !== false;
      return { data: null, loading: enabled, error: null };
    });
    return { results, loading: results.some((r) => r.loading), error: null };
  });

  const runAll = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const initialResults = queryConfigs.map((c) => {
      const enabled = (c.options || {}).enabled !== false;
      return { data: null, loading: enabled, error: null };
    });

    setState((prev) => ({
      results: initialResults,
      loading: initialResults.some((r) => r.loading),
      error: prev.error,
    }));

    const settled = await Promise.all(queryConfigs.map((c, i) => runOne(c, i, controller.signal)));
    if (controller.signal.aborted || !mountedRef.current) return;

    const results = queryConfigs.map((c, i) => {
      const r = settled[i];
      if (!r || r._aborted) return { data: null, loading: false, error: null };
      if (r._skip) return { data: null, loading: false, error: null };
      return { data: r.data || null, loading: false, error: r.error || null };
    });

    const firstError = results.find((r) => r.error);
    setState({ results, loading: false, error: firstError ? firstError.error : null });
  }, [configKey]);

  useEffect(() => {
    mountedRef.current = true;
    if (queryConfigs.length === 0) {
      setState({ results: [], loading: false, error: null });
      return undefined;
    }
    runAll();
    return () => {
      mountedRef.current = false;
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
    };
  }, [runAll]);

  const refetch = useCallback(() => runAll(), [runAll]);

  return { ...state, refetch };
}
