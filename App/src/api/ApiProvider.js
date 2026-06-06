import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiHealth } from './apiClient';
import { getDevBackendUrl, API_CONFIG } from './config';

const ApiHealthContext = createContext({
  state: 'checking',
  detail: null,
  retry: () => {},
  backendUrl: '',
});

export function useApiHealth() {
  return useContext(ApiHealthContext);
}

export function ApiProvider({ children, autoProbe = true, probeIntervalMs = 0 }) {
  const [state, setState] = useState('checking');
  const [detail, setDetail] = useState(null);
  const [backendUrl, setBackendUrl] = useState(() => getDevBackendUrl());

  const probe = useCallback(async () => {
    setState('checking');
    setDetail(null);
    const url = getDevBackendUrl();
    setBackendUrl(url);
    const response = await apiHealth();
    if (response.ok) {
      setState('healthy');
      setDetail(response.data || null);
    } else {
      setState('unhealthy');
      setDetail(response);
    }
  }, []);

  useEffect(() => {
    if (!autoProbe) return undefined;
    probe();
    if (!probeIntervalMs || probeIntervalMs <= 0) return undefined;
    const id = setInterval(() => { probe(); }, probeIntervalMs);
    return () => clearInterval(id);
  }, [autoProbe, probeIntervalMs, probe]);

  const value = { state, detail, retry: probe, backendUrl };
  return (
    <ApiHealthContext.Provider value={value}>
      {children}
    </ApiHealthContext.Provider>
  );
}

export function ApiHealthGate({ children, fallback }) {
  const { state, detail, retry, backendUrl } = useApiHealth();
  if (state === 'healthy') return children;
  if (fallback) return fallback({ state, detail, retry, backendUrl });
  return <DefaultHealthScreen state={state} detail={detail} onRetry={retry} backendUrl={backendUrl} />;
}

function DefaultHealthScreen({ state, detail, onRetry, backendUrl }) {
  const isChecking = state === 'checking';
  const status = detail && detail.status ? detail.status : null;
  const message = detail && detail.message ? detail.message : (detail && detail.payload ? JSON.stringify(detail.payload) : null);
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {isChecking ? 'Checking backend...' : 'Backend not reachable'}
        </Text>
        <Text style={styles.subtitle}>URL: {backendUrl}</Text>
        {status !== null && (
          <Text style={styles.detail}>Status: {status}</Text>
        )}
        {message && (
          <Text style={styles.detail}>{message}</Text>
        )}
        <Text style={styles.hint}>
          Make sure the gateway is running:{'\n'}
          cd backend && node src/gateway/gateway.js
        </Text>
        {!isChecking && (
          <TouchableOpacity style={styles.button} onPress={onRetry}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        )}
        {isChecking && (
          <View style={styles.spinner}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        )}
        <TouchableOpacity onPress={() => Linking.openURL('https://example.com')}>
          <Text style={styles.linkText}>See API_SETUP.md</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const HEALTH_STATES = Object.freeze({
  CHECKING: 'checking',
  HEALTHY: 'healthy',
  UNHEALTHY: 'unhealthy',
});

export { API_CONFIG, getDevBackendUrl };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    color: '#E2E8F0',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  detail: {
    color: '#FCA5A5',
    fontSize: 13,
    marginBottom: 6,
    textAlign: 'center',
  },
  hint: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  spinner: {
    marginTop: 20,
  },
  linkText: {
    color: '#60A5FA',
    fontSize: 13,
    marginTop: 16,
    textDecorationLine: 'underline',
  },
});
