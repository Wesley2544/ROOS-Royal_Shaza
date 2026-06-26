interface Props { value: string | number; label: string; color: string }

export default function StatCard({ value, label, color }: Props) {
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-[18px] p-3.5 text-center">
      <div className="text-xl font-extrabold" style={{ color }}>{value}</div>
      <div className="text-[11px] text-gray-400 mt-1">{label}</div>
    </div>
  )
}