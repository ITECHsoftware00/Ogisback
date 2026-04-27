import { useState, useEffect } from 'react';

export default function DonutChart({ data, size = 180, thickness = 24, onHover, hoveredIdx }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 40); return () => clearTimeout(t); }, []);
  if (!data?.length) return null;
  const r = (size - thickness) / 2, cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const GAP = data.length > 1 ? 3 : 0;
  let cum = 0;
  const segs = data.map((d, i) => {
    const rawLen = (d.value / total) * C;
    const len = Math.max(0, rawLen - GAP);
    const offset = C - cum;
    cum += rawLen;
    return { ...d, len, offset, idx: i };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#94a3b8" strokeWidth={thickness} opacity="0.15" />
      {segs.map(s => (
        <circle key={s.idx} cx={cx} cy={cy} r={r} fill="none" stroke={s.color}
          strokeWidth={hoveredIdx === s.idx ? thickness + 5 : thickness}
          strokeLinecap="butt" strokeDashoffset={s.offset}
          onMouseEnter={() => onHover?.(s.idx)} onMouseLeave={() => onHover?.(null)}
          style={{
            strokeDasharray: show ? `${s.len} ${C - s.len}` : `0 ${C}`,
            filter: hoveredIdx === s.idx ? `drop-shadow(0 0 8px ${s.color}bb)` : 'none',
            transition: `stroke-dasharray ${1.1 + s.idx * 0.1}s cubic-bezier(0.25,0.46,0.45,0.94) ${s.idx * 0.09}s, stroke-width 0.2s ease, filter 0.2s ease`,
            cursor: onHover ? 'pointer' : 'default',
          }} />
      ))}
    </svg>
  );
}
