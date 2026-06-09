export default function ErrorMessage({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 p-6">
      <div className="text-4xl">⚠️</div>
      <p className="text-sm text-gray-600 text-center">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          Try again
        </button>
      )}
    </div>
  )
}