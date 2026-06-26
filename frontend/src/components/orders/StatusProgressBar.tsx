const STEPS = ['Received', 'Preparing', 'On the way', 'Served']
const STATUS_STEP: Record<string, number> = { new:0, preparing:1, ready:2, served:3 }

export default function StatusProgressBar({ status }: { status: string }) {
  const currentStep = STATUS_STEP[status] ?? 0
  return (
    <div className="w-full">
      <div className="flex gap-1 mb-2">
        {STEPS.map((_, idx) => (
          <div key={idx} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${idx <= currentStep ? 'bg-[#0A0A0A]' : 'bg-[#E5E5E5]'}`} />
        ))}
      </div>
      <div className="flex justify-between">
        {STEPS.map((label, idx) => (
          <span key={idx} className={`text-[10px] font-medium ${idx <= currentStep ? 'text-[#0A0A0A]' : 'text-gray-400'}`}>{label}</span>
        ))}
      </div>
    </div>
  )
}