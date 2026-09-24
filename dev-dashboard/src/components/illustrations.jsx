import React from 'react';

/**
 * Themed SVG illustrations for empty states. All are inline, dependency-free,
 * inherit CSS variables, and carry one gently floating accent element
 * (disabled by the global prefers-reduced-motion kill-switch).
 */

function Float({ children, delay = 0 }) {
  return (
    <g className="art-float" style={{ animationDelay: `${delay}ms` }}>
      {children}
    </g>
  );
}

export function DataArt() {
  return (
    <svg viewBox="0 0 96 96" width="96" height="96" aria-hidden="true">
      <ellipse cx="48" cy="18" rx="28" ry="9" fill="var(--accent-soft)" stroke="var(--accent)" strokeOpacity="0.5" />
      <Float>
        <ellipse cx="48" cy="18" rx="28" ry="9" fill="none" stroke="var(--accent)" strokeOpacity="0.9" strokeWidth="1.5" />
      </Float>
      <path d="M20 18v22c0 5 12.5 9 28 9s28-4 28-9V18" fill="none" stroke="var(--border)" strokeWidth="2" />
      <path d="M20 40v22c0 5 12.5 9 28 9s28-4 28-9V40" fill="none" stroke="var(--border)" strokeWidth="2" />
      <path d="M20 62v14c0 5 12.5 9 28 9s28-4 28-9V62" fill="none" stroke="var(--border)" strokeWidth="2" />
      <Float delay={400}>
        <circle cx="72" cy="31" r="3" fill="var(--ok)" />
      </Float>
      <Float delay={700}>
        <circle cx="24" cy="53" r="3" fill="var(--warn)" />
      </Float>
    </svg>
  );
}

export function SearchArt() {
  return (
    <svg viewBox="0 0 96 96" width="96" height="96" aria-hidden="true">
      <Float>
        <circle cx="42" cy="42" r="20" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2.5" />
      </Float>
      <line x1="57" y1="57" x2="74" y2="74" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
      <Float delay={500}>
        <line x1="34" y1="42" x2="50" y2="42" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" />
      </Float>
      <Float delay={800}>
        <line x1="42" y1="34" x2="42" y2="50" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      </Float>
    </svg>
  );
}

export function OfflineArt() {
  return (
    <svg viewBox="0 0 96 96" width="96" height="96" aria-hidden="true">
      <Float>
        <path
          d="M30 54a14 14 0 1 1 3.4-27.6A18 18 0 0 1 68 32a12 12 0 0 1 2 23.8"
          fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2"
        />
      </Float>
      <line x1="24" y1="72" x2="72" y2="24" stroke="var(--err)" strokeWidth="2.5" strokeLinecap="round" />
      <Float delay={600}>
        <circle cx="48" cy="70" r="3" fill="var(--err)" />
      </Float>
    </svg>
  );
}

export function InboxArt() {
  return (
    <svg viewBox="0 0 96 96" width="96" height="96" aria-hidden="true">
      <path
        d="M24 44v26a4 4 0 0 0 4 4h40a4 4 0 0 0 4-4V44h-14l-4 8H42l-4-8H24z"
        fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2"
      />
      <Float delay={300}>
        <path d="M34 34l14-14 14 14" fill="none" stroke="var(--ok)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="48" y1="22" x2="48" y2="44" stroke="var(--ok)" strokeWidth="2.5" strokeLinecap="round" />
      </Float>
    </svg>
  );
}

export function CheckArt() {
  return (
    <svg viewBox="0 0 96 96" width="96" height="96" aria-hidden="true">
      <circle cx="48" cy="48" r="28" fill="var(--ok-soft)" stroke="var(--ok)" strokeWidth="2" />
      <Float>
        <path
          d="M36 49l9 9 16-18"
          fill="none" stroke="var(--ok)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
        />
      </Float>
    </svg>
  );
}

const ART = {
  data: DataArt,
  search: SearchArt,
  offline: OfflineArt,
  inbox: InboxArt,
  check: CheckArt,
};

/** Resolves `art` (component | key | undefined) to a rendered illustration. */
export function renderArt(art) {
  if (!art) return <DataArt />;
  if (typeof art === 'function' || (typeof art === 'object' && React.isValidElement(art))) {
    const Cmp = art;
    return typeof art === 'function' ? <Cmp /> : art;
  }
  const Cmp = ART[art];
  return Cmp ? <Cmp /> : <DataArt />;
}
