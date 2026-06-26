export default function LoadingSpinner({ message = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
      <div
        className="w-8 h-8 rounded-full animate-spin border-4 border-[#E5E5E5]"
        style={{ borderTopColor: '#0A0A0A' }}
      />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}