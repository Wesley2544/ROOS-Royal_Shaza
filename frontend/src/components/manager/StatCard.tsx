interface Props {
  value: string | number
  label: string
  color: string
}

export default function StatCard({ value, label, color }: Props) {
  return (
    <div className="bg-[#F5F9FE] border border-[#E0EAF5] rounded-xl p-3.5 text-center">
      <div className="text-xl font-extrabold" style={{ color }}>{value}</div>
      <div className="text-[11px] text-gray-400 mt-1">{label}</div>
    </div>
  )
}