/**
 * Signup flow tests.
 *
 * The client-side rules mirror BOTH validators the backend runs on
 * POST /auth/register: schemaValidator.js `register` (username/email/length)
 * and utils/passwordValidator.js (length, character classes). The server
 * remains the authority - these assert the form matches that contract, so a
 * user is not told a password is fine only for the backend to reject it.
 *
 * GOOD_PASSWORD satisfies every mirrored rule. It deliberately avoids runs of
 * three ascending/descending/repeated characters, which the server also
 * rejects.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from '../App.jsx';
import Login from '../pages/Login.jsx';
import { AuthProvider } from '../state/AuthContext.jsx';

// 14 chars, upper + lower + digit + symbol, no 3-char sequence or repeat run.
const GOOD_PASSWORD = ' Bazaar#Qu7!ve ';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        {/* noValidate: the real form relies on native constraint validation,
            which jsdom does not implement. Without it, type="email" swallows
            the submit event before the app's own validation can run. */}
        <Login noValidate />
      </AuthProvider>
    </MemoryRouter>
  );
}

async function fillSignup({ username, email, password }) {
  // Scope to the signup form: the sign-in form is still mounted above it and
  // carries its own Username/Password labels, so a global query is ambiguous.
  const form = screen.getByRole('form', { name: /create an account/i });
  const field = (label) =>
    within(form).getByLabelText(label);
  fireEvent.change(field(/^username$/i), { target: { value: username } });
  fireEvent.change(field(/^email$/i), { target: { value: email } });
  fireEvent.change(field(/^password/i), { target: { value: password } });
  fireEvent.click(within(form).getByRole('button', { name: /create account/i }));
}

describe('signup validation mirrors the backend schema', () => {
  it('rejects a username shorter than 3 characters', async () => {
    global.fetch = vi.fn();
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /create a supply-chain account/i }));
    await fillSignup({ username: 'ab', email: 'a@b.com', password: GOOD_PASSWORD });
    expect(await screen.findByRole('alert')).toHaveProperty('textContent');
    expect(screen.getByRole('alert').textContent).toMatch(/username must be 3-50/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects an invalid email', async () => {
    global.fetch = vi.fn();
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /create a supply-chain account/i }));
    await fillSignup({ username: 'shopkeeper_01', email: 'not-an-email', password: GOOD_PASSWORD });
    expect(screen.getByRole('alert').textContent).toMatch(/valid email/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects a password under 12 characters', async () => {
    global.fetch = vi.fn();
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /create a supply-chain account/i }));
    await fillSignup({ username: 'shopkeeper_01', email: 'a@b.com', password: 'short' });
    expect(screen.getByRole('alert').textContent).toMatch(/at least 12 characters/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // The server's validatePassword also requires character classes. Without
  // these the form would accept a password the backend always rejects.
  it.each([
    ['no uppercase', 'bazaar#qu7!ve', /uppercase/i],
    ['no lowercase', 'BAZAAR#QU7!VE', /lowercase/i],
    ['no digit', 'Bazaar#Quv!e', /number/i],
    ['no special character', 'BazaarQu7lve12', /special character/i],
  ])('rejects a long password with %s', async (_label, password, expected) => {
    global.fetch = vi.fn();
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /create a supply-chain account/i }));
    await fillSignup({ username: 'shopkeeper_01', email: 'a@b.com', password });
    expect(screen.getByRole('alert').textContent).toMatch(expected);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('names every missing character class in one message', async () => {
    global.fetch = vi.fn();
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /create a supply-chain account/i }));
    // Long enough, but nothing but lowercase letters.
    await fillSignup({ username: 'shopkeeper_01', email: 'a@b.com', password: 'bazaarquseven' });
    const message = screen.getByRole('alert').textContent;
    expect(message).toMatch(/uppercase/i);
    expect(message).toMatch(/number/i);
    expect(message).toMatch(/special character/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('signup error surfacing', () => {
  /**
   * `server.cjs` re-wraps upstream failures as `{success:false, error:<body>}`,
   * so `error` arrives as an OBJECT. Reading `.message` off it is undefined,
   * which previously degraded every real error to a generic message.
   */
  function openSignupWith(response) {
    global.fetch = vi.fn(async () => response);
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /create a supply-chain account/i }));
    return fillSignup({
      username: 'shopkeeper_01',
      email: 'shop@example.com',
      password: GOOD_PASSWORD,
    });
  }

  it('unwraps the nested proxy error body', async () => {
    await openSignupWith({
      ok: false,
      status: 409,
      json: async () => ({
        success: false,
        error: { success: false, error: 'Username already exists' },
      }),
    });
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toMatch(/username already exists/i)
    );
  });

  it('prefers the specific detail over the generic wrapper message', async () => {
    await openSignupWith({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: {
          success: false,
          error: 'Password does not meet security requirements',
          details: ['Password must contain at least one special character'],
        },
      }),
    });
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toMatch(/at least one special character/i)
    );
  });

  it('still accepts a flat string error', async () => {
    await openSignupWith({
      ok: false,
      status: 409,
      json: async () => ({ success: false, error: 'Username already exists' }),
    });
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toMatch(/username already exists/i)
    );
  });

  it('falls back to the status code when no message is present', async () => {
    await openSignupWith({ ok: false, status: 502, json: async () => ({}) });
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/\(502\)/));
  });
});

describe('signup submission', () => {
  it('posts the exact fields the backend expects', async () => {
    global.fetch = vi.fn(async () => ({ ok: true, status: 201, json: async () => ({ success: true }) }));
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /create a supply-chain account/i }));
    await fillSignup({ username: 'shopkeeper_01', email: 'shop@example.com', password: GOOD_PASSWORD });

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/auth/register');
    expect(init.method).toBe('POST');
    // additionalProperties is false in the schema, so extra fields would 400.
    expect(JSON.parse(init.body)).toEqual({
      username: 'shopkeeper_01',
      email: 'shop@example.com',
      password: GOOD_PASSWORD,
    });
  });

  it('surfaces the server error rather than a generic failure', async () => {
    global.fetch = vi.fn(async () => ({
      ok: false,
      status: 409,
      json: async () => ({ success: false, error: 'Username already exists' }),
    }));
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /create a supply-chain account/i }));
    await fillSignup({ username: 'shopkeeper_01', email: 'shop@example.com', password: GOOD_PASSWORD });

    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/username already exists/i));
  });

  it('confirms success without implying console access', async () => {
    global.fetch = vi.fn(async () => ({ ok: true, status: 201, json: async () => ({ success: true }) }));
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /create a supply-chain account/i }));
    await fillSignup({ username: 'shopkeeper_01', email: 'shop@example.com', password: GOOD_PASSWORD });

    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/account created/i));
    // New users get the 'user' role and cannot open this admin console.
    expect(screen.getByRole('status').textContent).toMatch(/admin-only/i);
  });
});

describe('login screen', () => {
  it('shows the sign-in form first', () => {
    global.fetch = vi.fn();
    sessionStorage.removeItem('cp_token');
    render(<MemoryRouter><AuthProvider><Login /></AuthProvider></MemoryRouter>);
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeTruthy();
  });

  it('shows the login screen for an unauthenticated app', () => {
    global.fetch = vi.fn();
    sessionStorage.removeItem('cp_token');
    render(
      <MemoryRouter initialEntries={['/business']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('form')).toBeTruthy();
  });
});
