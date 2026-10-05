import React, { useState } from 'react';
import { useAuth } from '../state/AuthContext.jsx';
import { BrandMark, Icon } from '../components/icons.jsx';

/**
 * Mirrors the two validators the backend runs on POST /auth/register:
 *  - schemaValidator.js `register`   (username / email / min length)
 *  - utils/passwordValidator.js      (length, character classes, sequences)
 *
 * The constraints are enforced client-side purely to save a round trip and
 * give immediate feedback; the server still validates and remains the
 * authority. Keeping them in sync matters because a mismatch shows a
 * valid-looking form that the backend then rejects for no visible reason.
 *
 * The sequential/repeated-character rule is deliberately NOT mirrored: it is
 * a fuzzy heuristic with no useful client-side phrasing, so the server's own
 * message is surfaced instead.
 */
const SIGNUP_RULES = {
  username: /^[a-zA-Z0-9_-]{3,50}$/,
  email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
  passwordMin: 12,
  upper: /[A-Z]/,
  lower: /[a-z]/,
  digit: /[0-9]/,
  special: /[!@#$%^&*(),.?":{}|<>]/,
};

function validateSignup({ username, email, password }) {
  if (!SIGNUP_RULES.username.test(username)) {
    return 'Username must be 3-50 characters: letters, numbers, underscore or dash.';
  }
  if (!SIGNUP_RULES.email.test(email)) {
    return 'Enter a valid email address.';
  }
  if (password.length < SIGNUP_RULES.passwordMin) {
    return `Password must be at least ${SIGNUP_RULES.passwordMin} characters.`;
  }
  const missing = [
    [SIGNUP_RULES.upper, 'an uppercase letter'],
    [SIGNUP_RULES.lower, 'a lowercase letter'],
    [SIGNUP_RULES.digit, 'a number'],
    [SIGNUP_RULES.special, 'a special character'],
  ]
    .filter(([re]) => !re.test(password))
    .map(([, label]) => label);
  if (missing.length) {
    return `Password needs ${missing.join(', ')}.`;
  }
  return null;
}

/**
 * Pull a human-readable reason out of a failed registration response.
 *
 * `server.cjs` proxies upstream failures as `{success:false, error:<upstream
 * body>}`, so `error` is an OBJECT holding the backend's own
 * `{success,error,details}` — not a string. Reading `.message` off it yields
 * undefined and silently degrades a useful error into a generic one, so the
 * nested shape is unwrapped here and `details` (the per-rule reasons from
 * validatePassword) is preferred when present.
 */
function registrationErrorMessage(body, status) {
  const upstream = body && typeof body.error === 'object' ? body.error : body;
  if (upstream && Array.isArray(upstream.details) && upstream.details.length) {
    const first = upstream.details.find((d) => typeof d === 'string');
    if (first) return first;
  }
  if (upstream && typeof upstream.error === 'string') return upstream.error;
  if (typeof body?.error === 'string') return body.error;
  return `Registration failed (${status})`;
}

/**
 * `noValidate` disables the browser's native constraint validation. Production
 * relies on it; the test suite turns it off because jsdom does not implement
 * it, and `type="email"` would otherwise swallow the submit before the
 * app's own validation and error message could run.
 */
export default function Login({ noValidate = false }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupError, setSignupError] = useState(null);
  const [signupDone, setSignupDone] = useState(null);
  const [signupBusy, setSignupBusy] = useState(false);

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

  async function submitSignup(e) {
    e.preventDefault();
    const invalid = validateSignup({ username, email, password: signupPassword });
    if (invalid) {
      setSignupError(invalid);
      return;
    }

    setSignupBusy(true);
    setSignupError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password: signupPassword }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok || body.success === false) {
        // Surface the server's own message; it is more specific than anything
        // the client can infer (duplicate username, weak password, lockout).
        setSignupError(registrationErrorMessage(body, res.status));
        return;
      }

      // New accounts start on the 'user' role and cannot reach this console,
      // which is admin-gated. Say so rather than implying they can sign in.
      setSignupDone(username);
    } catch (err) {
      setSignupError(err.message || 'Could not reach the server');
    } finally {
      setSignupBusy(false);
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

        {mode === 'signin' ? (
            <button
              type="button"
              className="secondary"
              style={{ width: '100%', marginTop: 14 }}
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
            >
              Create a supply-chain account
            </button>
          ) : (
            <form className="card" onSubmit={submitSignup} aria-label="Create an account" noValidate={noValidate} style={{ marginTop: 16 }}>
              <h3 style={{ marginTop: 0 }}>Create an account</h3>
              <p className="muted" style={{ fontSize: 12, marginTop: 0 }}>
                Shopkeepers, transporters and wholesalers can self-register here.
              </p>

              <label htmlFor="signup-username">Username</label>
              <input
                id="signup-username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />

              <label htmlFor="signup-email" style={{ marginTop: 12 }}>Email</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label htmlFor="signup-password" style={{ marginTop: 12 }}>
                Password{' '}
                <span className="muted">
                  (min {SIGNUP_RULES.passwordMin} characters, with upper and lower case, a number and a
                  symbol)
                </span>
              </label>
              <input
                id="signup-password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                required
              />

              {signupError && (
                <div className="login-error" role="alert">
                  <Icon name="alert" size={14} />
                  {signupError}
                </div>
              )}

              {signupDone && (
                <div className="card" role="status" style={{ marginTop: 12 }}>
                  <strong>Account created.</strong>
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                    {signupDone} can now sign in to the mobile app. This console is
                    admin-only, so use the app to trade.
                  </div>
                </div>
              )}

              <div className="row" style={{ gap: 8, marginTop: 16 }}>
                <button
                  type="submit"
                  disabled={signupBusy || !username || !email || !signupPassword}
                  style={{ flex: 1 }}
                >
                  {signupBusy ? 'Creating…' : 'Create account'}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setMode('signin');
                    setSignupError(null);
                  }}
                >
                  Back
                </button>
              </div>
            </form>
          )}
      </div>
    </div>
  );
}
