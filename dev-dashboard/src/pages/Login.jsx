import React, { useState } from 'react';
import { useAuth } from '../state/AuthContext.jsx';
import { BrandMark, Icon } from '../components/icons.jsx';

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
          <div className="row" style={{ gap: 12, marginBottom: 20 }}>
            <BrandMark size={38} />
            <div>
              <h1>CSCM Control Plane</h1>
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

          <label htmlFor="login-password" style={{ marginTop: 12 }}>Password</label>
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
              <Icon name="alert" size={14} />
              {error}
            </div>
          )}

          <button type="submit" disabled={busy || !username || !password} style={{ width: '100%', marginTop: 18 }}>
            {busy ? (
              <>
                <span className="spinner" style={{ width: 14, height: 14, borderTopColor: 'currentColor' }} aria-hidden="true" />
                Signing in…
              </>
            ) : (
              <>
                <Icon name="key" size={15} />
                Sign in
              </>
            )}
          </button>

          <p className="muted" style={{ fontSize: 12, marginTop: 16, lineHeight: 1.55 }}>
            Credentials come from <code>DASHBOARD_USER</code> / <code>DASHBOARD_PASSWORD</code> on
            the dashboard server. Sessions expire automatically.
          </p>
        </form>
      </div>
    </div>
  );
}
