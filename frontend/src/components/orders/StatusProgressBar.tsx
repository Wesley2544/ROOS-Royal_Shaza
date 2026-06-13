const STEPS = ['Received', 'Preparing', 'On the way', 'Served']

const STATUS_STEP: Record<string, number> = {
  new:       0,
  preparing: 1,
  ready:     2,
  served:    3,
}

export default function StatusProgressBar({ status }: { status: string }) {
  const currentStep = STATUS_STEP[status] ?? 0

  return (
    <div className="w-full">
      {/* Progress bars */}
      <div className="flex gap-1 mb-2">
        {STEPS.map((_, idx) => (
          <div
            key={idx}
            className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
              idx <= currentStep ? 'bg-[#1A3C5E]' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Step labels */}
      <div className="flex justify-between">
        {STEPS.map((label, idx) => (
          <span
            key={idx}
            className={`text-[10px] font-medium ${
              idx <= currentStep ? 'text-[#1A3C5E]' : 'text-gray-400'
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}