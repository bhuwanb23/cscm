import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FLAT_NAV } from '../lib/nav.js';
import { Icon } from './icons.jsx';
import { prefersReducedMotion } from './motion.jsx';

/**
 * Ctrl/Cmd+K command palette — grouped, keyboard-first navigation.
 * Actions: run a SQL query, search backend logs. Plus every page, fuzzy-filtered.
 */

const ACTIONS = [
  { kind: 'action', mode: 'sql', label: 'Run SQL query…', icon: 'terminal', group: 'Actions' },
  { kind: 'action', mode: 'logs', label: 'Search backend logs…', icon: 'search', group: 'Actions' },
];

function score(query, text) {
  const q = query.toLowerCase().trim();
  if (!q) return 1;
  const t = text.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  const idx = t.indexOf(q);
  if (idx >= 0) return 60 - Math.min(30, idx * 2);
  // subsequence match (e.g. "slq" still finds "sql console")
  let i = 0;
  for (const ch of t) {
    if (ch === q[i]) {
      i += 1;
      if (i === q.length) return 20;
    }
  }
  return -1;
}

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Reset search state on every open and focus the input.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  const results = useMemo(() => {
    const items = [
      ...ACTIONS,
      ...FLAT_NAV.map((n) => ({ kind: 'nav', path: n.path, label: n.label, icon: n.icon, group: n.group })),
    ];
    if (!query.trim()) return items;
    return items
      .map((item) => ({ item, s: Math.max(score(query, item.label), score(query, item.group) * 0.5) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.item);
  }, [query]);

  const close = useCallback(() => onClose(), [onClose]);

  const run = useCallback(
    (item) => {
      close();
      if (!item) return;
      const q = query.trim();
      if (item.kind === 'action') {
        if (item.mode === 'sql') navigate(q ? `/db/query?q=${encodeURIComponent(q)}` : '/db/query');
        if (item.mode === 'logs') navigate(q ? `/logs?q=${encodeURIComponent(q)}` : '/logs');
      } else {
        navigate(item.path);
      }
    },
    [close, navigate, query]
  );

  // Keyboard: arrows + enter + escape; keep the active row visible.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((a) => Math.min(results.length - 1, a + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        run(results[active]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, results, active, run, close]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [active]);

  if (!open) return null;

  let lastGroup = null;

  return (
    <div className="palette-scrim" onClick={close}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="palette-head">
          <span className="palette-glyph"><Icon name="search" size={16} /></span>
          <input
            ref={inputRef}
            className="palette-input"
            placeholder="Jump to a page, run a query…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            aria-label="Search pages and actions"
            aria-controls="palette-listbox"
            aria-activedescendant={results[active] ? `palette-opt-${active}` : undefined}
            spellCheck="false"
          />
          <span className="kbd" aria-hidden="true">esc</span>
        </div>

        <ul className="palette-list" id="palette-listbox" role="listbox" aria-label="Results" ref={listRef}>
          {results.length === 0 && (
            <li className="palette-empty" role="status">No matches — try a page name or type an SQL query.</li>
          )}
          {results.map((item, idx) => {
            const showGroup = item.group !== lastGroup;
            lastGroup = item.group;
            const sel = idx === active;
            return (
              <React.Fragment key={`${item.kind}:${item.mode || item.path}`}>
                {showGroup && <li className="palette-group" role="presentation">{item.group}</li>}
                <li
                  id={`palette-opt-${idx}`}
                  data-idx={idx}
                  role="option"
                  aria-selected={sel}
                  className={`palette-item${sel ? ' active' : ''}`}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => run(item)}
                >
                  {item.icon && <Icon name={item.icon} size={15} />}
                  <span className="palette-label">{item.label}</span>
                  {item.kind === 'action' && <span className="kbd">↵</span>}
                  {item.kind === 'nav' && (
                    <span className="faint" style={{ fontSize: 11, fontFamily: 'var(--mono)' }}>{item.path}</span>
                  )}
                </li>
              </React.Fragment>
            );
          })}
        </ul>

        <div className="palette-foot">
          <span className="row" style={{ gap: 5 }}><span className="kbd">↑</span><span className="kbd">↓</span> navigate</span>
          <span className="row" style={{ gap: 5 }}><span className="kbd">↵</span> open</span>
          <span className="row" style={{ gap: 5 }}><span className="kbd">esc</span> close</span>
          <span style={{ marginLeft: 'auto' }}>Aurora Console</span>
        </div>
      </div>
    </div>
  );
}
