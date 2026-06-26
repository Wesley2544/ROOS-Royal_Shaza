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
  const mins = getElapsedMinutes(createdAt)
  if (status === 'new'       && mins >= 3) return 'high'
  if (status === 'preparing' && mins >= 8) return 'medium'
  return 'low'
}

export function getUrgencyColor(level: string): string {
  return { high: '#DC2626', medium: '#D97706', low: '#16A34A' }[level] || '#16A34A'
}

export function getStatusLabel(status: string): string {
  return { new:'New', preparing:'Preparing', ready:'Ready', served:'Served' }[status] || status
}