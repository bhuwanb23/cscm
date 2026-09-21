import React, { useState } from 'react';
import { useAuth } from '../state/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-box">
        <form className="card" onSubmit={submit} aria-label="Sign in to CSCM Control">
          <div className="row" style={{ gap: 10, marginBottom: 18 }}>
            <span className="logo" aria-hidden="true" style={{
              width: 30, height: 30, display: 'grid', placeItems: 'center',
              background: 'linear-gradient(135deg, var(--accent), #7c5cff)',
              borderRadius: 8, fontSize: 14,
            }}>⚡</span>
            <div>
              <h1 style={{ fontSize: 18 }}>CSCM Control Plane</h1>
              <div className="muted" style={{ fontSize: 12.5 }}>Supply-chain operations console</div>
            </div>
          </div>

          <label htmlFor="login-username">Username</label>
          <input
            id="login-username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="login-error" role="alert">
              <span aria-hidden="true">⚠</span>
              {error}
            </div>
          )}

          <button type="submit" disabled={busy || !username || !password} style={{ width: '100%', marginTop: 16 }}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="muted" style={{ fontSize: 12, marginTop: 14, lineHeight: 1.5 }}>
            Credentials come from <code>DASHBOARD_USER</code> / <code>DASHBOARD_PASSWORD</code> on
            the dashboard server. Sessions expire automatically.
          </p>
        </form>
      </div>
    </div>
  );
}
