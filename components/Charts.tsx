"use client";

import { useState } from "react";

// Lightweight hover tooltip: absolutely positioned inside a `relative` chart wrapper,
// pointer-events-none so it can never shift the layout or swallow the mouse.
function ChartTip({ style, children }: { style: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div
      className="pointer-events-none absolute z-20 whitespace-nowrap rounded-xl border border-line bg-butter px-2.5 py-1.5 text-[11px] font-semibold leading-snug text-ink shadow-card"
      style={style}
    >
      {children}
    </div>
  );
}

function clampPct(pct: number, min = 10, max = 90) {
  return Math.min(max, Math.max(min, pct));
}

export function ColumnChart({
  data,
  height = 180,
  valueFormat
}: {
  data: { label: string; value: number; color?: string; pct?: string | number }[];
  height?: number;
  valueFormat?: (v: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 720;
  const pad = { top: 16, right: 8, bottom: 30, left: 8 };
  const max = Math.max(...data.map((d) => d.value), 1);
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const slot = innerW / data.length;
  const barW = Math.min(slot * 0.62, 46);
  const active = hover !== null ? data[hover] : null;
  const activeCenter =
    hover !== null ? clampPct(((pad.left + slot * hover + slot / 2) / width) * 100) : 50;

  return (
    <div className="relative w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={pad.left}
            x2={width - pad.right}
            y1={pad.top + innerH * (1 - t)}
            y2={pad.top + innerH * (1 - t)}
            stroke="#EDE6DA"
            strokeWidth={1}
          />
        ))}
        {data.map((d, i) => {
          const h = (d.value / max) * innerH;
          const x = pad.left + slot * i + (slot - barW) / 2;
          const y = pad.top + innerH - h;
          return (
            <g
              key={d.label}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((prev) => (prev === i ? null : prev))}
            >
              <rect x={pad.left + slot * i} y={pad.top} width={slot} height={innerH} fill="transparent" />
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(h, 1)}
                rx={Math.min(6, barW / 2)}
                fill={d.color || "#AFC6E9"}
                opacity={hover === null || hover === i ? 1 : 0.55}
              />
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#211D18">
                {valueFormat ? valueFormat(d.value) : d.value.toLocaleString()}
              </text>
              <text x={x + barW / 2} y={height - 10} textAnchor="middle" fontSize="10" fontWeight="600" fill="#8A8177">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      {active && (
        <ChartTip style={{ left: `${activeCenter}%`, top: 2, transform: "translateX(-50%)" }}>
          <div className="font-bold">{active.label}</div>
          <div className="text-ink-soft">
            {valueFormat ? valueFormat(active.value) : active.value.toLocaleString()}
            {active.pct !== undefined && <span className="ml-1.5">· {active.pct}</span>}
          </div>
        </ChartTip>
      )}
    </div>
  );
}

export function HBarChart({
  data,
  valueFormat
}: {
  data: { label: string; value: number; sub?: string; color?: string; pct?: string | number }[];
  valueFormat?: (v: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3.5">
      {data.map((d, i) => (
        <div
          key={d.label}
          className="relative flex flex-col gap-1"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover((prev) => (prev === i ? null : prev))}
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs font-semibold">{d.label}</span>
            <span className="text-xs font-bold">
              {valueFormat ? valueFormat(d.value) : d.value.toLocaleString()}
              {d.sub && <span className="ml-1.5 font-medium text-ink-faint">{d.sub}</span>}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color || "#AFC6E9" }}
            />
          </div>
          {hover === i && (
            <ChartTip style={{ right: 0, bottom: "100%", marginBottom: 6 }}>
              <div className="font-bold">{d.label}</div>
              <div className="text-ink-soft">
                {valueFormat ? valueFormat(d.value) : d.value.toLocaleString()}
                {d.pct !== undefined && <span className="ml-1.5">· {d.pct}</span>}
              </div>
            </ChartTip>
          )}
        </div>
      ))}
    </div>
  );
}

export function AreaLineChart({
  points,
  height = 200,
  burstColor = "#EF9A80"
}: {
  points: { label: string; value: number; burst?: boolean; baseline?: number | null; burstRatio?: number | null }[];
  height?: number;
  burstColor?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 900;
  const pad = { top: 14, right: 10, bottom: 26, left: 42 };
  const max = Math.max(...points.map((p) => p.value), 1);
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const step = points.length > 1 ? innerW / (points.length - 1) : innerW;
  const coords = points.map((p, i) => ({
    x: pad.left + step * i,
    y: pad.top + innerH - (p.value / max) * innerH,
    burst: p.burst,
    label: p.label,
    value: p.value,
    baseline: p.baseline,
    burstRatio: p.burstRatio
  }));
  const line = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const area = `${pad.left},${pad.top + innerH} ${line} ${pad.left + innerW},${pad.top + innerH}`;
  const active = hover !== null ? coords[hover] : null;

  return (
    <div className="relative w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img">
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={pad.top + innerH * (1 - t)} y2={pad.top + innerH * (1 - t)} stroke="#EDE6DA" strokeWidth={1} />
            <text x={pad.left - 6} y={pad.top + innerH * (1 - t) + 3} textAnchor="end" fontSize="9" fontWeight="600" fill="#8A8177">
              {Math.round(max * t).toLocaleString()}
            </text>
          </g>
        ))}
        <polygon points={area} fill="#AFC6E9" opacity={0.28} />
        <polyline points={line} fill="none" stroke="#7FA3D4" strokeWidth={1.8} strokeLinejoin="round" />
        {coords.filter((c) => c.burst).map((c) => (
          <circle key={c.label} cx={c.x} cy={c.y} r={3.4} fill={burstColor} stroke="#fff" strokeWidth={1.2} />
        ))}
        {coords.map((c, i) => (
          <circle
            key={`hit-${c.label}`}
            cx={c.x}
            cy={c.y}
            r={6}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover((prev) => (prev === i ? null : prev))}
          />
        ))}
        <text x={pad.left} y={height - 8} fontSize="9" fontWeight="600" fill="#8A8177">{points[0]?.label}</text>
        <text x={width - pad.right} y={height - 8} textAnchor="end" fontSize="9" fontWeight="600" fill="#8A8177">
          {points[points.length - 1]?.label}
        </text>
      </svg>
      {active && (
        <ChartTip
          style={{
            left: `${clampPct((active.x / width) * 100, 12, 88)}%`,
            top: 4,
            transform: "translateX(-50%)"
          }}
        >
          <div className="font-bold">{active.label}</div>
          <div className="text-ink-soft">Count {active.value.toLocaleString()}</div>
          {active.baseline !== null && active.baseline !== undefined && (
            <div className="text-ink-soft">Baseline {active.baseline.toLocaleString()}</div>
          )}
          {active.burstRatio !== null && active.burstRatio !== undefined && (
            <div className="text-ink-soft">Burst ratio {active.burstRatio}</div>
          )}
        </ChartTip>
      )}
    </div>
  );
}

export function DonutChart({
  data,
  size = 168
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const radius = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  let acc = 0;
  const segments = data.map((d) => {
    const frac = d.value / total;
    const dash = frac * circumference;
    const offset = -acc * circumference;
    acc += frac;
    return { d, dash, offset, frac };
  });
  const active = hover !== null ? segments[hover] : null;

  return (
    <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg width={size} height={size} className="shrink-0" role="img">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#EDE6DA" strokeWidth={16} />
        {segments.map(({ d, dash, offset }) => (
          <circle
            key={d.label}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={d.color}
            strokeWidth={16}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            opacity={hover === null || segments[hover]?.d.label === d.label ? 1 : 0.5}
          />
        ))}
        {segments.map(({ d, dash, offset }, i) => (
          <circle
            key={`hit-${d.label}`}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="transparent"
            strokeWidth={18}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            pointerEvents="stroke"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover((prev) => (prev === i ? null : prev))}
          />
        ))}
      </svg>
      <div className="flex w-full flex-col gap-2">
        {data.map((d, i) => (
          <div
            key={d.label}
            className="flex items-center justify-between gap-3 text-xs"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover((prev) => (prev === i ? null : prev))}
          >
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="font-semibold">{d.label}</span>
            </span>
            <span className="font-bold">
              {d.value.toLocaleString()}
              <span className="ml-1 font-medium text-ink-faint">
                {((d.value / total) * 100).toFixed(1)}%
              </span>
            </span>
          </div>
        ))}
      </div>
      {active && (
        <ChartTip style={{ left: `${size / 2}px`, top: 0, transform: "translateX(-50%)" }}>
          <div className="font-bold">{active.d.label}</div>
          <div className="text-ink-soft">
            {active.d.value.toLocaleString()} · {(active.frac * 100).toFixed(1)}%
          </div>
        </ChartTip>
      )}
    </div>
  );
}

export function Heatmap({
  rows,
  columns,
  values,
  color = "#EF9A80"
}: {
  rows: string[];
  columns: string[];
  values: number[][];
  color?: string;
}) {
  const max = Math.max(...values.flat(), 1);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="p-2 text-left text-[10px] font-bold uppercase tracking-wider text-ink-faint">
              Verdict \ Likelihood
            </th>
            {columns.map((c) => (
              <th key={c} className="p-2 text-center text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r}>
              <td className="whitespace-nowrap p-2 text-xs font-semibold">{r}</td>
              {columns.map((c, j) => {
                const v = values[i][j];
                const alpha = v === 0 ? 0 : 0.12 + (v / max) * 0.78;
                return (
                  <td
                    key={c}
                    className="rounded-xl p-2.5 text-center text-xs font-bold"
                    style={{
                      backgroundColor: v === 0 ? "#F5EFE6" : color,
                      opacity: v === 0 ? 1 : alpha,
                      color: alpha > 0.55 ? "#fff" : "#211D18"
                    }}
                  >
                    {v.toLocaleString()}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
