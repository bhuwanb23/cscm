import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost, apiGet } from './apiClient';

const TOKEN_KEY = 'cscm_auth_token';
const USER_KEY = 'cscm_auth_user';

export async function login(username, password) {
  const response = await apiPost('/api/v1/auth/login', {
    body: { username, password },
  });

  if (response.ok && response.data?.data?.token) {
    const { token, user } = response.data.data;
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    return { ok: true, token, user };
  }

  return { ok: false, error: response.data?.error || 'Login failed' };
}

export async function register(username, email, password, role) {
  const response = await apiPost('/api/v1/auth/register', {
    body: { username, email, password, role },
  });

  if (response.ok && response.data?.data?.token) {
    const { token, user } = response.data.data;
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    return { ok: true, token, user };
  }

  return { ok: false, error: response.data?.error || 'Registration failed' };
}

export async function getStoredToken() {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function getStoredUser() {
  try {
    const userStr = await AsyncStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export async function logout() {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
}

export async function getProfile() {
  const token = await getStoredToken();
  if (!token) return { ok: false, error: 'No token' };

  const response = await apiGet('/api/v1/auth/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.ok) {
    return { ok: true, user: response.data?.data?.user };
  }

  return { ok: false, error: response.data?.error || 'Failed to get profile' };
}
