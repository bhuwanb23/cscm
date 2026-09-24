import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

const MAX_VISIBLE = 4;
const EXIT_MS = 260; // keep in sync with the .toast transition duration

const TONE_ICON = { ok: '✓', err: '✕', warn: '!', info: 'i' };

/**
 * Toast notification system.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.success('Saved', 'Settings stored for this session.');
 *   toast.error('Query failed', err.message);
 *   toast.push({ tone: 'warn', title: 'Heads up', message: '…', duration: 8000 });
 *
 * Tones: ok | err | warn | info. Pass duration: Infinity to disable
 * auto-dismiss. Stack is capped at MAX_VISIBLE toasts.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    // Two-phase removal: mark as leaving (exit animation), then unmount.
    setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((ts) => ts.filter((t) => t.id !== id));
      const timer = timers.current.get(id);
      if (timer) {
        clearTimeout(timer);
        timers.current.delete(id);
      }
    }, EXIT_MS);
  }, []);

  const push = useCallback(
    (toast) => {
      counter.current += 1;
      const id = counter.current;
      const item = { id, tone: 'info', duration: 4200, ...toast };
      setToasts((ts) => [...ts, item].slice(-MAX_VISIBLE));
      if (item.duration !== Infinity) {
        timers.current.set(id, setTimeout(() => dismiss(id), item.duration));
      }
      return id;
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      push,
      dismiss,
      success: (title, message) => push({ tone: 'ok', title, message }),
      error: (title, message) => push({ tone: 'err', title, message, duration: 6500 }),
      warn: (title, message) => push({ tone: 'warn', title, message, duration: 6000 }),
      info: (title, message) => push({ tone: 'info', title, message }),
    }),
    [push, dismiss]
  );

  // Clear any pending auto-dismiss timers on unmount.
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="toast-viewport" aria-label="Notifications">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast ${t.tone}${t.leaving ? ' leaving' : ''}`}
          role={t.tone === 'err' ? 'alert' : 'status'}
        >
          <span className="t-icon" aria-hidden="true">
            {TONE_ICON[t.tone] || TONE_ICON.info}
          </span>
          <div className="t-body">
            <div className="t-title">{t.title}</div>
            {t.message && <div className="t-msg">{t.message}</div>}
          </div>
          <button className="t-close" onClick={() => onDismiss(t.id)} aria-label="Dismiss notification">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
