'use client'
interface Props { onClick: () => void; label?: string }
export default function RefreshButton({ onClick, label = 'Refresh' }: Props) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E5E5] rounded-xl text-xs font-bold text-[#0A0A0A] hover:bg-[#F5F5F5] transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/>
      </svg>
      {label}
    </button>
  )
}