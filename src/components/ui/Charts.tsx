import { useId } from 'react'

// ─── Shared types ──────────────────────────────────────────────────────────────

export interface DataPoint {
  label: string
  value: number
}

const ACCENT = '#007aff'
const GRID = '#292a2e'
const AXIS = '#8b90a0'

// ─── LineChart (area line) ──────────────────────────────────────────────────────

interface LineChartProps {
  data: DataPoint[]
  height?: number
  color?: string
  format?: (v: number) => string
}

export function LineChart({ data, height = 220, color = ACCENT, format = (v) => `${v}` }: LineChartProps) {
  const gid = useId().replace(/:/g, '')
  const width = 600
  const pad = { top: 16, right: 12, bottom: 28, left: 48 }
  const iw = width - pad.left - pad.right
  const ih = height - pad.top - pad.bottom

  const max = Math.max(...data.map((d) => d.value)) * 1.1
  const min = 0
  const x = (i: number) => pad.left + (i / Math.max(1, data.length - 1)) * iw
  const y = (v: number) => pad.top + ih - ((v - min) / (max - min)) * ih

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${x(data.length - 1).toFixed(1)},${(pad.top + ih).toFixed(1)} L${x(0).toFixed(1)},${(pad.top + ih).toFixed(1)} Z`
  const ticks = 4

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Line chart">
      <defs>
        <linearGradient id={`area-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const v = min + ((max - min) / ticks) * i
        const yy = y(v)
        return (
          <g key={i}>
            <line x1={pad.left} y1={yy} x2={width - pad.right} y2={yy} stroke={GRID} strokeWidth="1" />
            <text x={pad.left - 8} y={yy + 3} textAnchor="end" fontSize="9" fill={AXIS} fontFamily="monospace">
              {format(Math.round(v))}
            </text>
          </g>
        )
      })}
      <path d={areaPath} fill={`url(#area-${gid})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={d.label}>
          <circle cx={x(i)} cy={y(d.value)} r="3" fill="#121317" stroke={color} strokeWidth="2" />
          <text x={x(i)} y={height - 10} textAnchor="middle" fontSize="9" fill={AXIS} fontFamily="monospace">
            {d.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ─── BarChart ────────────────────────────────────────────────────────────────

interface BarChartProps {
  data: DataPoint[]
  height?: number
  color?: string
  format?: (v: number) => string
}

export function BarChart({ data, height = 220, color = ACCENT, format = (v) => `${v}` }: BarChartProps) {
  const width = 600
  const pad = { top: 16, right: 12, bottom: 28, left: 48 }
  const iw = width - pad.left - pad.right
  const ih = height - pad.top - pad.bottom
  const max = Math.max(...data.map((d) => d.value)) * 1.1
  const band = iw / data.length
  const barW = band * 0.55
  const ticks = 4

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Bar chart">
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const v = (max / ticks) * i
        const yy = pad.top + ih - (v / max) * ih
        return (
          <g key={i}>
            <line x1={pad.left} y1={yy} x2={width - pad.right} y2={yy} stroke={GRID} strokeWidth="1" />
            <text x={pad.left - 8} y={yy + 3} textAnchor="end" fontSize="9" fill={AXIS} fontFamily="monospace">
              {format(Math.round(v))}
            </text>
          </g>
        )
      })}
      {data.map((d, i) => {
        const h = (d.value / max) * ih
        const bx = pad.left + band * i + (band - barW) / 2
        const by = pad.top + ih - h
        return (
          <g key={d.label}>
            <rect x={bx} y={by} width={barW} height={h} rx="2" fill={color} opacity="0.9" />
            <text x={bx + barW / 2} y={height - 10} textAnchor="middle" fontSize="9" fill={AXIS} fontFamily="monospace">
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── DonutChart ────────────────────────────────────────────────────────────────

const DONUT_COLORS = ['#007aff', '#ff5c00', '#30d158', '#ffd60a', '#bf5af2', '#5ac8fa']

export function DonutChart({ data, size = 200 }: { data: DataPoint[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const r = size / 2
  const stroke = size * 0.16
  const radius = r - stroke / 2
  const circ = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Donut chart" className="shrink-0">
        <g transform={`rotate(-90 ${r} ${r})`}>
          <circle cx={r} cy={r} r={radius} fill="none" stroke={GRID} strokeWidth={stroke} />
          {data.map((d, i) => {
            const len = (d.value / total) * circ
            const seg = (
              <circle
                key={d.label}
                cx={r}
                cy={r}
                r={radius}
                fill="none"
                stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
                strokeWidth={stroke}
                strokeDasharray={`${len} ${circ - len}`}
                strokeDashoffset={-offset}
              />
            )
            offset += len
            return seg
          })}
        </g>
        <text x={r} y={r - 2} textAnchor="middle" fontSize="20" fontWeight="700" fill="#e3e2e7" fontFamily="monospace">
          {total}%
        </text>
        <text x={r} y={r + 16} textAnchor="middle" fontSize="9" fill={AXIS} fontFamily="monospace">
          TOTAL
        </text>
      </svg>
      <ul className="space-y-1.5 min-w-0">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
            <span className="text-[#c1c6d7] truncate">{d.label}</span>
            <span className="font-mono text-[#8b90a0] ml-auto pl-2">{d.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

export function Sparkline({ values, color = ACCENT, width = 100, height = 32 }: { values: number[]; color?: string; width?: number; height?: number }) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * width},${height - ((v - min) / range) * height}`)
    .join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
