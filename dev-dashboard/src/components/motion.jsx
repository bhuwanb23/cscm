import React, { useEffect, useRef, useState } from 'react';

/**
 * Motion primitives for the control plane.
 * All effects are GPU-friendly (transform/opacity only) and respect
 * prefers-reduced-motion via the CSS layer, plus a JS guard here.
 */

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

const DUR = 650;

/**
 * Animated number count-up. Re-animates whenever `value` changes.
 * Non-numeric values pass through untouched.
 */
export function CountUp({ value, duration = DUR, format }) {
  const numeric = typeof value === 'number' && Number.isFinite(value);
  const display = !numeric ? value : undefined;
  const [shown, setShown] = useState(numeric ? 0 : null);
  const fromRef = useRef(0);

  useEffect(() => {
    if (!numeric) return undefined;
    if (prefersReducedMotion()) {
      setShown(value);
      return undefined;
    }
    const from = fromRef.current;
    const to = value;
    if (from === to) {
      setShown(to);
      return undefined;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(from + (to - from) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, numeric]);

  if (!numeric) return <>{value === undefined || value === null || value === '' ? '—' : value}</>;

  const text = format ? format(shown) : Math.round(shown).toLocaleString();
  return <span data-live="true">{text}</span>;
}

/**
 * Inline SVG sparkline. Data is an array of numbers (oldest → newest).
 * Adds a soft gradient fill and an end-point dot. Pure render, no deps.
 */
export function Sparkline({ data = [], width = 120, height = 32, tone = 'accent', ariaLabel = 'trend' }) {
  if (!data || data.length < 2) return null;
  const stroke = tone === 'ok' ? 'var(--ok)' : tone === 'warn' ? 'var(--warn)' : tone === 'err' ? 'var(--err)' : 'var(--accent)';
  const gradId = `spark-${tone}-${data.length}-${Math.round(data[data.length - 1] * 100)}`;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = i * step;
    const y = height - 4 - ((v - min) / span) * (height - 8);
    return [x, y];
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  const [lastX, lastY] = pts[pts.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2.2" fill={stroke} />
    </svg>
  );
}

/**
 * Live UTC clock (mm:ss ticking) for the topbar. Mount once.
 */
export function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(now.getUTCHours()).padStart(2, '0');
  const mm = String(now.getUTCMinutes()).padStart(2, '0');
  const ss = String(now.getUTCSeconds()).padStart(2, '0');
  return (
    <span className="clock" title="Current UTC time">
      <span aria-hidden="true">◷</span> {hh}:{mm}:{ss} UTC
    </span>
  );
}
