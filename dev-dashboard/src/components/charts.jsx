import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/**
 * Chart primitives.
 *
 * Built on recharts (already a dependency, previously unused) and themed
 * entirely from CSS custom properties, so charts follow the token system
 * instead of hard-coding a second palette.
 *
 * Charts deliberately do NOT animate on mount (see ANIMATE below). Recharts'
 * entrance animation is driven by requestAnimationFrame, which browsers throttle
 * or suspend in background tabs — a chart opened in a background tab would stay
 * stuck at zero bars. It also delays the one thing an operator actually wants:
 * the number. Motion in this console lives in the KPI count-up, the reveal
 * stagger and the nav indicator, never in the plot itself.
 */

/**
 * Entrance animation is off everywhere. Set true to re-enable the draw-in if
 * you want it, but keep the background-tab caveat above in mind.
 */
const ANIMATE = false;

const AXIS = {
  stroke: 'var(--ink-4)',
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const GRID = 'var(--line)';

function compactINR(v) {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toFixed(0)}`;
}

function exactINR(v) {
  return `₹${(Number(v) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

/** Shared tooltip so every chart reads the same way. */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tip">
      <div className="chart-tip-date">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="chart-tip-row">
          <span className="chart-tip-dot" style={{ background: p.color || p.fill }} />
          <span className="chart-tip-name">{p.name}</span>
          <span className="chart-tip-val">{exactINR(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Trend area over time — the workhorse for daily revenue / GMV.
 * `series` is [{ key, name, colour }].
 */
export function TrendChart({ data = [], series = [], height = 240, xKey = 'date', formatX }) {
  if (!data.length) return null;
  return (
    <div className="chart" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.colour} stopOpacity="0.30" />
                <stop offset="100%" stopColor={s.colour} stopOpacity="0.01" />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey={xKey}
            {...AXIS}
            tickFormatter={formatX || ((v) => String(v).slice(5))}
            minTickGap={24}
          />
          <YAxis {...AXIS} tickFormatter={compactINR} width={54} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--line-strong)' }} />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.colour}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 0 }}
              isAnimationActive={ANIMATE}
              animationDuration={700}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Grouped bars — used where discrete per-day values are the point. */
export function BarsChart({ data = [], series = [], height = 240, xKey = 'date', formatX }) {
  if (!data.length) return null;
  return (
    <div className="chart" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey={xKey}
            {...AXIS}
            tickFormatter={formatX || ((v) => String(v).slice(5))}
            minTickGap={24}
          />
          <YAxis {...AXIS} tickFormatter={compactINR} width={54} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={s.colour}
              radius={[2, 2, 0, 0]}
              isAnimationActive={ANIMATE}
              animationDuration={650}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Horizontal ranked bars — the clearest way to show revenue concentration
 * per house. Sorted descending so the concentration risk is visible at a glance.
 */
export function RankBars({ data = [], valueKey = 'value', labelKey = 'label', height, formatX }) {
  const rows = useMemo(
    () => [...data].sort((a, b) => (Number(b[valueKey]) || 0) - (Number(a[valueKey]) || 0)),
    [data, valueKey]
  );
  if (!rows.length) return null;

  const h = height || Math.max(140, rows.length * 30 + 24);
  const max = Math.max(...rows.map((r) => Number(r[valueKey]) || 0), 1);

  return (
    <div className="rank-list" style={{ minHeight: h }}>
      {rows.map((r, i) => {
        const v = Number(r[valueKey]) || 0;
        const pct = (v / max) * 100;
        return (
          <div className="rank-row" key={r[labelKey] ?? i}>
            <span className="rank-label" title={r[labelKey]}>{r[labelKey]}</span>
            <span className="rank-track">
              <span
                className="rank-fill"
                style={{
                  width: `${Math.max(pct, 1.5)}%`,
                  animationDelay: `${i * 55}ms`,
                }}
              />
            </span>
            <span className="rank-value">{formatX ? formatX(v) : exactINR(v)}</span>
            {r.sub !== undefined && <span className="rank-sub">{r.sub}</span>}
          </div>
        );
      })}
    </div>
  );
}

/** Donut for plan mix — four slices is the readable maximum. */
export function Donut({ data = [], nameKey = 'name', valueKey = 'value', height = 220, colours }) {
  const palette = colours || ['var(--accent)', 'var(--cyan)', 'var(--violet)', 'var(--warn)'];
  if (!data.length) return null;
  return (
    <div className="donut" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={nameKey}
            innerRadius="58%"
            outerRadius="84%"
            paddingAngle={2}
            stroke="none"
            isAnimationActive={ANIMATE}
            animationDuration={700}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={palette[i % palette.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) =>
              active && payload && payload.length ? (
                <div className="chart-tip">
                  <div className="chart-tip-date">{payload[0].name}</div>
                  <div className="chart-tip-row">
                    <span className="chart-tip-dot" style={{ background: payload[0].payload.fill }} />
                    <span className="chart-tip-name">{payload[0].name}</span>
                    <span className="chart-tip-val">{payload[0].value}</span>
                  </div>
                </div>
              ) : null
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
