import { getDevBackendUrl } from './config';
import { getStoredToken } from './auth';

let wsInstance = null;
let listeners = new Map();
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

export function connectWebSocket() {
  if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
    return wsInstance;
  }

  const baseUrl = getDevBackendUrl();
  const wsUrl = baseUrl.replace(/^http/, 'ws') + '/ws';

  wsInstance = new WebSocket(wsUrl);

  wsInstance.onopen = () => {
    console.log('[ws] Connected');
    reconnectAttempts = 0;
    // Send auth token
    getStoredToken().then(token => {
      if (token && wsInstance.readyState === WebSocket.OPEN) {
        wsInstance.send(JSON.stringify({ type: 'auth', token }));
      }
    });
  };

  wsInstance.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      const { type, channel } = message;
      const key = channel || type;
      const callbacks = listeners.get(key) || [];
      callbacks.forEach(cb => cb(message));
      // Also notify wildcard listeners
      const wildcards = listeners.get('*') || [];
      wildcards.forEach(cb => cb(message));
    } catch (err) {
      console.warn('[ws] Failed to parse message:', err);
    }
  };

  wsInstance.onclose = () => {
    console.log('[ws] Disconnected');
    wsInstance = null;
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectTimer = setTimeout(() => {
        reconnectAttempts++;
        connectWebSocket();
      }, RECONNECT_DELAY * (reconnectAttempts + 1));
    }
  };

  wsInstance.onerror = (err) => {
    console.warn('[ws] Error:', err.message || 'Unknown error');
  };

  return wsInstance;
}

export function disconnectWebSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  reconnectAttempts = MAX_RECONNECT_ATTEMPTS; // Prevent reconnection
  if (wsInstance) {
    wsInstance.close();
    wsInstance = null;
  }
}

export function subscribe(channel, callback) {
  if (!listeners.has(channel)) {
    listeners.set(channel, []);
  }
  listeners.get(channel).push(callback);

  // Return unsubscribe function
  return () => {
    const cbs = listeners.get(channel) || [];
    const idx = cbs.indexOf(callback);
    if (idx >= 0) cbs.splice(idx, 1);
  };
}

export function sendMessage(message) {
  if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
    wsInstance.send(JSON.stringify(message));
    return true;
  }
  return false;
}

export function isConnected() {
  return wsInstance && wsInstance.readyState === WebSocket.OPEN;
}

// React hook for WebSocket subscriptions
export function useWebSocket(channel, callback, enabled = true) {
  const { useEffect } = require('react');

  useEffect(() => {
    if (!enabled) return undefined;

    connectWebSocket();
    const unsubscribe = subscribe(channel, callback);

    return () => {
      unsubscribe();
    };
  }, [channel, enabled]);
}
