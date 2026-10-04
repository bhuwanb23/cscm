import React, { useEffect, useRef, useState } from 'react';
import { CountUp, Sparkline, prefersReducedMotion } from './motion.jsx';
import { useToast } from '../state/ToastContext.jsx';
import { renderArt } from './illustrations.jsx';

/* ------------------------------------------------------------- helpers -- */

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <div className="muted">{subtitle}</div>}
      </div>
      {actions && <div className="row wrap">{actions}</div>}
    </div>
  );
}

const TONE_COLORS = {
  ok: 'var(--ok)',
  warn: 'var(--warn)',
  err: 'var(--err)',
  accent: 'var(--accent)',
};

export function Kpi({ label, value, sub, tone, spark }) {
  const toneColor = tone && TONE_COLORS[tone] ? { color: TONE_COLORS[tone] } : undefined;
  const animated = typeof value === 'number' && Number.isFinite(value);
  return (
    <div className="card">
      <h3>{label}</h3>
      <div className="spark-row">
        <div className="value" style={toneColor}>
          {animated ? <CountUp value={value} /> : value === undefined || value === null || value === '' ? '—' : value}
        </div>
        {spark && spark.length > 1 && (
          <Sparkline data={spark} tone={tone} ariaLabel={`${label} trend`} />
        )}
      </div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

/**
 * Health states are not all binary. An earlier version treated anything that
 * was not literally "healthy/ok/closed" as a failure, which painted healthy
 * subscription rows (`active`) red. Keep an explicit positive set instead.
 */
const STATUS_OK = new Set([
  'healthy', 'ok', 'closed', 'active', 'paid', 'succeeded', 'delivered',
  'running', 'online', 'available', 'success',
]);
const STATUS_WARN = new Set([
  'unknown', 'pending', 'degraded', 'trialing', 'processing', 'open',
  'shipped', 'in_transit', 'in transit', 'confirmed',
]);

function statusTone(status) {
  const s = String(status || 'unknown').toLowerCase();
  if (STATUS_OK.has(s)) return 'ok';
  if (STATUS_WARN.has(s)) return 'warn';
  return 'err';
}

export function StatusPill({ status, mini }) {
  const label = status || 'unknown';
  const cls = statusTone(label);
  const dotCls = cls === 'ok' ? 'healthy' : cls === 'warn' ? 'unknown' : 'unhealthy';

  if (mini) {
    return (
      <span className="row" style={{ gap: 6 }} title={label}>
        <span className={`status-dot ${dotCls}`} aria-hidden="true" />
        <span className="status-word">{label}</span>
      </span>
    );
  }

  return (
    <span className="row" style={{ gap: 6 }}>
      <span className={`status-dot ${dotCls}`} aria-hidden="true" />
      <span className={`badge ${cls}`}>{label}</span>
    </span>
  );
}

/* -------------------------------------------------------------- states -- */

export function Spinner({ size = 18 }) {
  return <span className="spinner" style={{ width: size, height: size }} role="status" aria-label="Loading" />;
}

export function Skeleton({ variant = 'text', style }) {
  return <div className={`skeleton ${variant}`} style={style} aria-hidden="true" />;
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="skeleton-table" role="status" aria-label="Loading data" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="row" />
      ))}
    </div>
  );
}

export function SkeletonKpis({ count = 4 }) {
  return (
    <div className="kpi-row" role="status" aria-label="Loading metrics" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="kpi" />
      ))}
    </div>
  );
}

/**
 * Loading placeholder. Defaults to a shimmering skeleton table so pages keep
 * their layout height while data loads. Pass `label` to show a status line
 * under the skeleton (useful for slow calls like AI/ML requests).
 */
export function Loading({ label, skeleton = true, rows = 5 }) {
  if (skeleton) {
    return (
      <div>
        <SkeletonTable rows={rows} />
        {label && (
          <div className="muted" style={{ padding: '8px 2px 0', fontSize: 12 }} role="status" aria-live="polite">
            {label}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="muted" style={{ padding: 14, fontSize: 13 }} role="status" aria-live="polite">
      {label || 'Loading…'}
    </div>
  );
}

/**
 * Empty state with a themed SVG illustration.
 * `art`: 'data' | 'search' | 'offline' | 'inbox' | 'check' — or a custom component/element.
 */
export function EmptyState({ art = 'data', icon, title = 'Nothing here yet', hint, action }) {
  return (
    <div className="empty-state" role="status">
      <div className="art" aria-hidden="true">{icon ? icon : renderArt(art)}</div>
      <h3>{title}</h3>
      {hint && <p>{hint}</p>}
      {action}
    </div>
  );
}

/**
 * Route-level crash containment.
 *
 * Without this, a page that throws during render unmounts the entire React
 * tree — the console goes white, including the nav you would need to navigate
 * away with. Wrapping <Routes> degrades a broken page to an in-shell message.
 *
 * `resetKey` (the pathname) clears the error on navigation, so moving to
 * another page recovers without a reload.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep the detail in the console for debugging; the UI stays calm.
    console.error('Page render failed:', error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    const message = String(this.state.error?.message || this.state.error);
    return (
      <>
        <div className="error-banner" role="alert">
          <span aria-hidden="true">⚠</span>
          <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
            This page failed to render: {message}
          </span>
          <button className="ghost sm" onClick={() => this.setState({ error: null })}>
            Retry
          </button>
        </div>
        <p className="muted" style={{ marginTop: 12 }}>
          The rest of the console is unaffected — pick another page from the navigation.
        </p>
      </>
    );
  }
}

export function ErrorBanner({ error, onRetry }) {
  if (!error) return null;
  const message = String(error.message || error);
  return (
    <div className="error-banner" role="alert">
      <span aria-hidden="true">⚠</span>
      <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{message}</span>
      {onRetry && (
        <button className="ghost sm" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ clipboard -- */

/**
 * Copy-to-clipboard button with success feedback. Falls back to a hidden
 * textarea + execCommand when the async Clipboard API is unavailable.
 */
export function CopyButton({ text, label = 'Copy', className = 'ghost sm' }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    const value = typeof text === 'string' ? text : String(text ?? '');
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        ok = true;
      }
    } catch {
      /* fall through to legacy path */
    }
    if (!ok) {
      try {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand('copy');
        ta.remove();
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1400);
    } else {
      toast.error('Copy failed', 'Clipboard access was blocked by the browser.');
    }
  }

  return (
    <button type="button" className={className} onClick={copy} aria-label={`Copy to clipboard: ${label}`}>
      {copied ? '✓ Copied' : label}
    </button>
  );
}

/* --------------------------------------------------------------- table -- */

/**
 * Dense data table.
 *
 * Two deliberate choices keep wide/long tables from turning clumsy:
 *
 * 1. Long result sets scroll inside a capped viewport instead of growing the
 *    page without bound (a 452-row shipments table was rendering a 25,000px
 *    document). The header stays pinned so the columns remain identifiable.
 *    Short tables lay out normally — the cap only applies once a table is tall
 *    enough to need it.
 *
 * 2. Cells are single-line and ellipsised, with the full value on `title`, so
 *    one long identifier cannot stretch a column and push everything else into
 *    a ragged edge. Opt a column out with `wrap: true`.
 */
export function DataTable({
  columns,
  rows,
  empty = 'No data',
  keyField = 'id',
  actions,
  loading,
  loadingRows = 5,
  maxHeight = 560,
  scrollAfter = 18,
}) {
  if (loading) return <SkeletonTable rows={loadingRows} />;

  // Array.isArray, not a truthiness/length check. A partial API payload yields
  // `{}` rather than `[]`, and `{}` is truthy with undefined.length, so it
  // slipped past the old guard and threw on rows.map below — blanking the page
  // through the error boundary instead of rendering an empty table.
  if (!Array.isArray(rows) || rows.length === 0) {
    return typeof empty === 'string' ? (
      <EmptyState title={empty} hint="Data may appear once the system has activity." />
    ) : (
      empty
    );
  }

  const scrollable = rows.length > scrollAfter;
  const colCount = columns.length + (actions ? 1 : 0);

  return (
    <div className="table-wrap">
      <div
        className="table-scroll"
        data-scrollable={scrollable ? 'true' : undefined}
        style={scrollable ? { maxHeight } : undefined}
      >
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={[
                    c.align === 'num' ? 'num' : '',
                    c.wrap ? 'wrap' : '',
                  ]
                    .filter(Boolean)
                    .join(' ') || undefined}
                  style={c.width ? { width: c.width } : undefined}
                >
                  {c.label}
                </th>
              ))}
              {actions && (
                <th className="actions-col" scope="col">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row[keyField] !== undefined ? row[keyField] : i}>
                {columns.map((c) => {
                  const raw = row[c.key];
                  const content = c.render ? (
                    c.render(row)
                  ) : (
                    <span title={raw === undefined || raw === null ? undefined : String(raw)}>
                      {raw === undefined || raw === null || raw === '' ? '—' : String(raw)}
                    </span>
                  );
                  return (
                    <td
                      key={c.key}
                      className={[
                        c.align === 'num' ? 'num' : '',
                        c.wrap ? 'wrap' : '',
                      ]
                        .filter(Boolean)
                        .join(' ') || undefined}
                      style={c.width ? { maxWidth: c.width } : undefined}
                    >
                      {content}
                    </td>
                  );
                })}
                {actions && <td className="actions-col">{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-foot">
        <span>
          {rows.length} {rows.length === 1 ? 'row' : 'rows'}
        </span>
        {scrollable && <span className="muted">Scroll for more</span>}
      </div>
    </div>
  );
}

export function JsonView({ data, copy }) {
  const json = JSON.stringify(data, null, 2);
  return (
    <div>
      {copy && (
        <div className="json-head">
          <CopyButton text={json} label="Copy JSON" />
        </div>
      )}
      <pre className="json-view">{json}</pre>
    </div>
  );
}

/* ---------------------------------------------------------- scroll-top -- */

/** Floating button that appears after scrolling down a long page. */
export function ScrollTopButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!show) return null;
  return (
    <button
      className="scroll-top"
      aria-label="Scroll back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })}
    >
      ↑
    </button>
  );
}

export function useAsyncData(fn, deps = []) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => !cancelled && setState({ loading: false, data, error: null }))
      .catch((error) => !cancelled && setState({ loading: false, data: null, error }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, refresh: () => setTick((t) => t + 1) };
}
