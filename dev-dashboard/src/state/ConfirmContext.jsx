import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const ConfirmContext = createContext(null);

/**
 * Promise-based confirm dialog (replaces window.confirm).
 *
 * Usage:
 *   const confirm = useConfirm();
 *   const ok = await confirm({
 *     title: 'Delete user?',
 *     message: 'This cannot be undone.',
 *     confirmLabel: 'Delete', // defaults to Confirm; danger styling by default
 *   });
 *   if (!ok) return;
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const confirmBtnRef = useRef(null);

  const confirm = useCallback((opts) => {
    if (typeof opts === 'string') opts = { title: opts };
    return new Promise((resolve) => {
      setState({
        title: 'Are you sure?',
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel',
        danger: true,
        ...opts,
        resolve,
      });
    });
  }, []);

  const settle = useCallback((val) => {
    setState((s) => {
      if (s) s.resolve(val);
      return null;
    });
  }, []);

  // Escape cancels; focus lands on the confirm button for keyboard flows.
  useEffect(() => {
    if (!state) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') settle(false);
      if (e.key === 'Enter' && document.activeElement?.tagName !== 'BUTTON') {
        e.preventDefault();
        settle(true);
      }
    };
    window.addEventListener('keydown', onKey);
    const focusTimer = setTimeout(() => confirmBtnRef.current?.focus(), 30);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(focusTimer);
    };
  }, [state, settle]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="modal-scrim" onClick={() => settle(false)}>
          <div
            className="modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby={state.message ? 'confirm-msg' : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="confirm-title">{state.title}</h3>
            {state.message && <p id="confirm-msg">{state.message}</p>}
            <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button className="secondary" onClick={() => settle(false)}>
                {state.cancelLabel}
              </button>
              <button ref={confirmBtnRef} className={state.danger ? 'danger' : ''} onClick={() => settle(true)}>
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
}
