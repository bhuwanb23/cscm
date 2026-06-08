const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = parseInt(process.env.EXPO_PUBLIC_GATEWAY_PORT, 10) || 8080;
const DEFAULT_TIMEOUT_MS = 30000;
const HEALTH_PATH = '/health';

function readEnvBackendUrl() {
  if (typeof process === 'undefined' || !process.env) return null;
  const value = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim().replace(/\/+$/, '');
  return trimmed.length > 0 ? trimmed : null;
}

function readHostUriBackendUrl() {
  try {
    const mod = require('expo-constants');
    const Constants = mod && mod.default ? mod.default : mod;
    if (!Constants) return null;

    const expoConfigHost = Constants.expoConfig && Constants.expoConfig.hostUri;
    const debuggerHost = Constants.manifest2 && Constants.manifest2.extra && Constants.manifest2.extra.expoGo
      ? Constants.manifest2.extra.expoGo.debuggerHost
      : null;
    const manifestHost = Constants.manifest && Constants.manifest.debuggerHost;

    const hostUri = expoConfigHost || debuggerHost || manifestHost;
    if (!hostUri || typeof hostUri !== 'string') return null;

    const colonIndex = hostUri.lastIndexOf(':');
    if (colonIndex < 0) return null;
    const host = hostUri.slice(0, colonIndex).replace(/[\[\]]/g, '');
    if (!host) return null;
    return `http://${host}:${DEFAULT_PORT}`;
  } catch (err) {
    return null;
  }
}

let cachedUrl = null;

export function getDevBackendUrl() {
  if (cachedUrl) return cachedUrl;
  const fromEnv = readEnvBackendUrl();
  if (fromEnv) {
    cachedUrl = fromEnv;
    return cachedUrl;
  }
  const fromHostUri = readHostUriBackendUrl();
  if (fromHostUri) {
    cachedUrl = fromHostUri;
    return cachedUrl;
  }
  cachedUrl = `http://${DEFAULT_HOST}:${DEFAULT_PORT}`;
  return cachedUrl;
}

export function resetBackendUrlCache() {
  cachedUrl = null;
}

export const API_CONFIG = Object.freeze({
  get baseUrl() { return getDevBackendUrl(); },
  timeoutMs: DEFAULT_TIMEOUT_MS,
  healthPath: HEALTH_PATH,
  defaultHeaders: Object.freeze({ 'Content-Type': 'application/json' }),
});
