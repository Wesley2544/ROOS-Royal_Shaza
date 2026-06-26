export default function ErrorMessage({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 p-6">
      <div className="text-4xl">⚠️</div>
      <p className="text-sm text-gray-600 text-center">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-[#FDC700] text-[#0A0A0A] text-sm font-bold rounded-xl hover:brightness-95"
        >
          Try again
        </button>
      )}
    </div>
  )
}