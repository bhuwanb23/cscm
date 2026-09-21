import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('cp_token'));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('cp_user')) || null;
    } catch {
      return null;
    }
  });

  async function login(username, password) {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      throw new Error(body.error || 'Login failed');
    }
    sessionStorage.setItem('cp_token', body.token);
    sessionStorage.setItem('cp_user', JSON.stringify({ username }));
    setToken(body.token);
    setUser({ username });
  }

  function logout() {
    sessionStorage.removeItem('cp_token');
    sessionStorage.removeItem('cp_user');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
