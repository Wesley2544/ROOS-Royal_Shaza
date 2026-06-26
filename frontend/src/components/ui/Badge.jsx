import { STATUS } from '@/lib/statusStyles'

export default function Badge({ status }) {
  const s = STATUS[status] || STATUS.free
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}