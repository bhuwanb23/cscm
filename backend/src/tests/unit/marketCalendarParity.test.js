/**
 * Cross-language market calendar parity.
 *
 * The Node backend and the Python ML service each carry a copy of the Tamil
 * festival dates, because they run as separate services with no shared code.
 * That duplication is a silent-drift hazard: if one side gains an override and
 * the other does not, the dashboard calls a day "trading" while the forecaster
 * receives it flagged as a holiday (or vice versa), and demand features for
 * that day are wrong with no visible error anywhere.
 *
 * This test reads the Python module directly and asserts the two agree. It
 * needs no Python to run if the module is unreadable - in that case it skips
 * rather than failing, so the JS suite stays usable without a Python install.
 */

const fs = require('fs');
const path = require('path');

const { OVERRIDES, MOVING_RULES } = require('../../domain/marketCalendar');

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const PY_CALENDAR = path.join(REPO_ROOT, 'ai-ml', 'utils', 'calendar_utils.py');

/** Pull EXACT_HOLIDAYS out of the Python module without executing it. */
function readPythonExactHolidays() {
  const source = fs.readFileSync(PY_CALENDAR, 'utf8');
  const block = /EXACT_HOLIDAYS\s*=\s*\{([\s\S]*?)\n\}/.exec(source);
  if (!block) return null;
  const out = {};
  const re = /'([0-9]{4}-[0-9]{2}-[0-9]{2})':\s*'([^']*)'/g;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(block[1])) !== null) out[m[1]] = m[2];
  return out;
}

/** Expand JS overrides into the full set of days they actually close. */
function jsExactClosedDays(year) {
  const out = new Set();
  for (const [date, info] of Object.entries(OVERRIDES)) {
    if (!date.startsWith(`${year}-`)) continue;
    const span = Math.max(1, Number(info.duration) || 1);
    const start = new Date(`${date}T00:00:00Z`);
    for (let i = 0; i < span; i += 1) {
      const d = new Date(start.getTime() + i * 86400000).toISOString().slice(0, 10);
      out.add(d);
    }
  }
  return out;
}

describe('market calendar cross-language parity', () => {
  const py = readPythonExactHolidays();

  it('can read the Python calendar module', () => {
    expect(fs.existsSync(PY_CALENDAR)).toBe(true);
    expect(py).not.toBeNull();
  });

  it('agrees with Python on every exact 2026 festival date', () => {
    if (!py) return; // defensive; the previous test already asserts this

    // JS models a multi-day festival as one entry plus a `duration`, while
    // Python lists each closed day explicitly. Compare the expanded day sets,
    // otherwise a correctly-modelled two-day festival looks like a mismatch.
    const js2026 = [...jsExactClosedDays('2026')].sort();
    const py2026 = Object.keys(py)
      .filter((k) => k.startsWith('2026-'))
      .sort();

    expect(js2026).toEqual(py2026);
  });

  it('agrees with Python on festival names', () => {
    if (!py) return;
    for (const [date, info] of Object.entries(OVERRIDES)) {
      if (!date.startsWith('2026-')) continue;
      if (!(date in py)) continue;
      expect(info.name).toBe(py[date]);
    }
  });

  it('does not resurrect the US-only holidays this calendar replaced', () => {
    // These were the original sample data and belong to the wrong country.
    const names = Object.values(OVERRIDES)
      .map((v) => v.name.toLowerCase())
      .concat(MOVING_RULES.map((r) => r.name.toLowerCase()));
    expect(names.some((n) => n.includes('thanksgiving'))).toBe(false);
    expect(names.some((n) => n.includes('independence day'))).toBe(false);
  });
});
