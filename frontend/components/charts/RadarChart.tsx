import React from "react";

type Axis = { label: string; value: number };

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function RadarChart({
  axes,
  size = 260,
}: {
  axes: Axis[];
  size?: number;
}) {
  const n = axes.length;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) * 0.72;

  const angleFor = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const points = axes
    .map((a, i) => {
      const v = clamp01(a.value);
      const ang = angleFor(i);
      const x = cx + Math.cos(ang) * r * v;
      const y = cy + Math.sin(ang) * r * v;
      return `${x},${y}`;
    })
    .join(" ");

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* grid */}
      {gridLevels.map((lvl) => {
        const poly = axes
          .map((_, i) => {
            const ang = angleFor(i);
            const x = cx + Math.cos(ang) * r * lvl;
            const y = cy + Math.sin(ang) * r * lvl;
            return `${x},${y}`;
          })
          .join(" ");
        return (
          <polygon
            key={lvl}
            points={poly}
            fill="none"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth="1"
          />
        );
      })}

      {/* axes lines */}
      {axes.map((a, i) => {
        const ang = angleFor(i);
        const x2 = cx + Math.cos(ang) * r;
        const y2 = cy + Math.sin(ang) * r;
        return (
          <line
            key={a.label}
            x1={cx}
            y1={cy}
            x2={x2}
            y2={y2}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
          />
        );
      })}

      {/* value polygon */}
      <polygon
        points={points}
        fill="rgba(164,255,0,0.18)"
        stroke="rgba(164,255,0,0.9)"
        strokeWidth="2"
      />

      {/* center dot */}
      <circle cx={cx} cy={cy} r="2.5" fill="rgba(164,255,0,0.9)" />
    </svg>
  );
}

