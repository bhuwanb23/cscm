#!/usr/bin/env node
/**
 * Stylesheet contract check.
 *
 * A redesign that silently drops a class does not throw — it just renders
 * unstyled. The bug this exists to prevent, found during the 2026-10 redesign:
 * StatusPill emits `status-dot healthy|unknown|unhealthy` while the new sheet
 * styled `status-dot ok|warn|err`, so every health indicator rendered neutral
 * grey with no error anywhere.
 *
 * Two things are verified:
 *
 *   1. Every literal `className="a b"` class has a rule in styles.css.
 *   2. Every dynamic modifier class — the tokens that can appear at runtime
 *      from a template-literal className — has a rule. These are listed
 *      explicitly rather than guessed by regex: a heuristic here produced
 *      false positives on JS punctuation and CSS custom-property names, and a
 *      guard that cries wolf is a guard nobody runs.
 *
 * Run: npm run check:css   (also runs as the first step of npm run build)
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(root, 'src');
const CSS = join(root, 'src', 'styles.css');

/**
 * Modifier classes reachable only at runtime, with the file that emits them.
 * Adding a new one-liner className template means adding it here too.
 */
const DYNAMIC_MODIFIERS = {
  // StatusPill / ServiceHealth — health dots, not badges
  healthy: 'src/components/ui.jsx',
  unknown: 'src/components/ui.jsx',
  unhealthy: 'src/components/ui.jsx',
  // badge + toast tones
  ok: 'src/components/ui.jsx',
  warn: 'src/components/ui.jsx',
  err: 'src/components/ui.jsx',
  info: 'src/state/ToastContext.jsx',
  // state modifiers
  active: 'src/App.jsx',
  open: 'src/App.jsx',
  leaving: 'src/state/ToastContext.jsx',
  // Skeleton variants (default is 'text')
  text: 'src/components/ui.jsx',
  kpi: 'src/components/ui.jsx',
  row: 'src/components/ui.jsx',
};

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(jsx?|js)$/.test(entry)) out.push(full);
  }
  return out;
}

const css = readFileSync(CSS, 'utf8');
const defined = new Set([...css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));

const literal = new Map();
for (const file of walk(SRC)) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/className\s*=\s*"([^"]+)"/g)) {
    for (const c of m[1].split(/\s+/)) {
      if (c) literal.set(c, relative(root, file));
    }
  }
}

const missing = [];
for (const [cls, file] of literal) {
  if (!defined.has(cls)) missing.push([cls, file]);
}
for (const [cls, file] of Object.entries(DYNAMIC_MODIFIERS)) {
  if (!defined.has(cls)) missing.push([cls, file]);
}

console.log(`literal classes referenced : ${literal.size}`);
console.log(`dynamic modifiers checked  : ${Object.keys(DYNAMIC_MODIFIERS).length}`);
console.log(`class selectors in styles  : ${defined.size}`);

if (missing.length) {
  console.error(`\nMISSING (${missing.length}) — these render unstyled:`);
  for (const [cls, file] of missing.sort()) console.error(`  .${cls}  ← ${file}`);
  process.exit(1);
}

console.log('\nOK — every referenced class has a rule in styles.css.');
