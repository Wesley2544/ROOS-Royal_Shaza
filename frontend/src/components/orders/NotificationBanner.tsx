import { useEffect, useState } from 'react'

interface Props {
  message: string
  type:    string
}

export default function NotificationBanner({ message, type }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), 8000)
    return () => clearTimeout(timer)
  }, [message])

  if (!visible) return null

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50 text-sm font-medium text-gray-700">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      <span>{message}</span>
    </div>
  )
}