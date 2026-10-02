import React, { useEffect, useRef, useState } from 'react';

/**
 * Motion primitives for the control plane.
 *
 * Hand-rolled on purpose: there is no animation library in the bundle, and
 * rAF keeps the whole thing ~4KB instead of ~40KB. Everything here collapses
 * to an instant final state under prefers-reduced-motion — a chart that never
 * draws is worse than no chart at all.
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
 * True when the count-up should be skipped and the final value painted
 * immediately.
 *
 * A hidden tab never gets animation frames, so an rAF-driven count would sit at
 * 0 indefinitely — a KPI reading "0" in a background tab is worse than no
 * animation at all. Same reasoning as the charts: never let motion delay a
 * number an operator is trying to read.
 */
function shouldSkipAnimation() {
  return prefersReducedMotion() || (typeof document !== 'undefined' && document.hidden);
}

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
    if (shouldSkipAnimation()) {
      fromRef.current = value;
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
 * Inline SVG sparkline with a draw-on reveal.
 *
 * The line is animated via stroke-dashoffset rather than a JS loop: the path
 * length is measured once, so the animation stays on the compositor instead of
 * driving React state every frame. The area fill fades in behind it.
 */
export function Sparkline({ data = [], width = 120, height = 32, tone = 'accent', ariaLabel = 'trend' }) {
  const reduced = prefersReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (reduced) {
      setReady(true);
      return undefined;
    }
    // One frame later so the dash length is applied before the transition runs.
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  if (!data || data.length < 2) return null;

  const stroke =
    tone === 'ok' ? 'var(--ok)' :
    tone === 'warn' ? 'var(--warn)' :
    tone === 'err' ? 'var(--err)' : 'var(--accent)';

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

  // Unique per series so multiple sparklines on one page never share a gradient.
  const uid = `sp${Math.abs(hash(line)).toString(36)}`;
  const pathLen = Math.max(...pts.map(([x, y]) => Math.hypot(x, y)), 1) + width;
  const dash = ready ? 'none' : pathLen;
  const offset = ready ? 0 : pathLen;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
      className="spark-svg"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.26" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={area}
        fill={`url(#${uid})`}
        className={ready ? 'spark-area' : ''}
      />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={ready ? 'spark-line' : ''}
        style={ready ? undefined : { strokeDasharray: dash, strokeDashoffset: offset }}
      />
      <circle cx={lastX} cy={lastY} r="2.2" fill={stroke} className={ready ? 'spark-dot' : ''} />
    </svg>
  );
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/**
 * Staggered reveal for a list of cards.
 *
 * Deliberately capped: a stagger is only legible for a handful of items. Past
 * ~8 the last card lands after the reader has already scanned past it.
 */
export function Reveal({ children, step = 45, max = 8, className = '' }) {
  const reduced = prefersReducedMotion();
  const items = React.Children.toArray(children).slice(0, max);

  if (reduced) {
    return <div className={className}>{items}</div>;
  }

  return (
    <div className={className}>
      {items.map((child, i) => (
        <div
          key={child.key ?? i}
          className="reveal"
          style={{ animationDelay: `${i * step}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

/**
 * A marker that slides between rail items to show where you are.
 *
 * Positioned from measured DOM rects rather than index arithmetic, so it stays
 * correct when the rail wraps or items are hidden on narrow viewports.
 */
export function useSlidingIndicator(itemSelector, activePath) {
  const ref = useRef(null);
  const [style, setStyle] = useState({ opacity: 0 });

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;

    const position = () => {
      const active = root.querySelector(`[data-path="${CSS.escape(activePath || '')}"]`);
      if (!active) {
        setStyle({ opacity: 0 });
        return;
      }
      const a = active.getBoundingClientRect();
      const r = root.getBoundingClientRect();
      setStyle({
        opacity: 1,
        transform: `translateY(${a.top - r.top}px)`,
        height: `${a.height}px`,
      });
    };

    position();
    // Re-measure when the rail reflows rather than on every resize tick.
    const ro = new ResizeObserver(position);
    ro.observe(root);
    window.addEventListener('resize', position);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', position);
    };
  }, [activePath, itemSelector]);

  return { ref, style };
}

/**
 * Count a number up to a target on mount, then hold. Used for the revenue
 * headline so the figure is felt, not just read.
 */
export function useAnimatedNumber(value, duration = 900) {
  const reduced = prefersReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced || typeof value !== 'number' || !Number.isFinite(value)) {
      setDisplay(value);
      return undefined;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(value * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduced]);

  return display;
}

export function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <time className="clock" dateTime={now.toISOString()}>
      {now.toISOString().slice(11, 19)} UTC
    </time>
  );
}
