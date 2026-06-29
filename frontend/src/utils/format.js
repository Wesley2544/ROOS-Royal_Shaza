// Format KES price from cents to display string
export function formatPrice(cents) {
  return `KES ${cents.toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

// Wait time from created_at to now
export function getElapsedMinutes(createdAt) {
  const diff = Date.now() - new Date(createdAt).getTime()
  return Math.floor(diff / 1000 / 60)
}

// Elapsed time as MM:SS string (for kitchen display)
export function getElapsedTime(createdAt) {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
  const m = Math.floor(diff / 60).toString().padStart(2, '0')
  const s = (diff % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// Urgency level for kitchen display
export function getUrgencyLevel(createdAt, status) {
  const mins = getElapsedMinutes(createdAt)
  if (status === 'new'      && mins >= 3) return 'high'
  if (status === 'preparing'&& mins >= 8) return 'medium'
  return 'low'
}

// Urgency colour for kitchen urgency bar
export function getUrgencyColor(level) {
  return {
    high:   '#E24B4A',
    medium: '#BA7517',
    low:    '#3B6D11',
  }[level] || '#3B6D11'
}

// Status label for display
export function getStatusLabel(status) {
  return {
    new:       'New',
    preparing: 'Preparing',
    ready:     'Ready',
    served:    'Served',
  }[status] || status
}