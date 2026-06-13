import { useEffect, useState } from 'react'

interface Props {
  message: string
  type:    string
}

const BANNER_STYLES: Record<string, string> = {
  received:  'bg-blue-50  border-blue-200  text-blue-800',
  preparing: 'bg-amber-50 border-amber-200 text-amber-800',
  ready:     'bg-green-50 border-green-200 text-green-800',
  served:    'bg-gray-50  border-gray-200  text-gray-700',
}

const BANNER_ICONS: Record<string, string> = {
  received:  '🔔',
  preparing: '👨‍🍳',
  ready:     '🍽',
  served:    '✅',
}

export default function NotificationBanner({ message, type }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), 8000)
    return () => clearTimeout(timer)
  }, [message])

  if (!visible) return null

  const style = BANNER_STYLES[type] || BANNER_STYLES.received
  const icon  = BANNER_ICONS[type]  || '🔔'

  return (
    <div className={`flex items-center gap-2 px-4 py-3 border-b text-sm font-medium ${style} animate-fadeIn`}>
      <span>{icon}</span>
      <span>{message}</span>
    </div>
  )
}