'use client'
import { CumulativePoint } from '@/hooks/useReports'
import { formatPrice } from '@/utils/format'

const WIDTH = 560, HEIGHT = 180
const PAD_LEFT = 8, PAD_RIGHT = 8, PAD_TOP = 12, PAD_BOTTOM = 24

export default function CumulativeChart({ data }: { data: CumulativePoint[] }) {
  if (!data || data.length === 0) {
    return <div className="text-xs text-gray-400 py-10 text-center">No revenue data in this range yet</div>
  }

  const max = Math.max(...data.map(d => d.amount), 1)
  const innerW = WIDTH - PAD_LEFT - PAD_RIGHT
  const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM

  const points = data.map((d, i) => ({
    x: data.length === 1 ? PAD_LEFT : PAD_LEFT + (i / (data.length - 1)) * innerW,
    y: PAD_TOP + innerH - (d.amount / max) * innerH,
    ...d,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const baseline = (PAD_TOP + innerH).toFixed(1)
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${baseline} L ${points[0].x.toFixed(1)} ${baseline} Z`
  const labelStep = Math.max(1, Math.ceil(points.length / 6))
  const finalAmount = data[data.length - 1].amount

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[11px] text-gray-400">Running total</span>
        <span className="text-lg font-extrabold text-[#0A0A0A]">{formatPrice(finalAmount)}</span>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f} x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={PAD_TOP + innerH * (1 - f)} y2={PAD_TOP + innerH * (1 - f)} stroke="#F0F0F0" strokeWidth="1" />
        ))}
        <path d={areaPath} fill="#FDC700" opacity="0.12" />
        <path d={linePath} fill="none" stroke="#FDC700" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 3.5 : 2} fill="#0A0A0A" />
        ))}
      </svg>
      <div className="relative mt-1" style={{ height: '14px' }}>
        {points.map((p, i) => (
          (i % labelStep === 0 || i === points.length - 1) ? (
            <span key={i} className="absolute text-[9px] text-gray-400 -translate-x-1/2" style={{ left: `${(p.x / WIDTH) * 100}%` }}>
              {p.label}
            </span>
          ) : null
        ))}
      </div>
    </div>
  )
}