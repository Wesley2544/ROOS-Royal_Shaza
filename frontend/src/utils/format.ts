export function formatPrice(cents: number): string {
  return `KES ${cents.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function getElapsedMinutes(createdAt: string): number {
  const diff = Date.now() - new Date(createdAt).getTime()
  return Math.floor(diff / 1000 / 60)
}

export function getElapsedTime(createdAt: string): string {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
  const m = Math.floor(diff / 60).toString().padStart(2, '0')
  const s = (diff % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function getUrgencyLevel(createdAt: string, status: string): string {
  if (status === 'served') return 'low'
  const mins = getElapsedMinutes(createdAt)
  if (status === 'new' && mins >= 3) return 'high' // nobody's acknowledged it yet — most urgent
  if (mins >= 10) return 'high'
  if (mins >= 5) return 'medium'
  return 'low'
}

export function getUrgencyColor(level: string): string {
  return { high: '#DC2626', medium: '#D97706', low: '#16A34A' }[level] || '#16A34A'
}

export function getStatusLabel(status: string): string {
  return { new: 'Sent', preparing: 'Received', ready: 'Received', served: 'Served' }[status] || status
}