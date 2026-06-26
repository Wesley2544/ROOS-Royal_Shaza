// Single source of truth for status colors across the whole app.
// Hues unchanged (red/amber/green) — strengthened per request.
export const STATUS = {
  new:       { bg: 'bg-red-200',   text: 'text-red-800',   label: 'New' },
  preparing: { bg: 'bg-amber-200', text: 'text-amber-800', label: 'Preparing' },
  ready:     { bg: 'bg-green-200', text: 'text-green-800', label: 'Ready ●' },
  served:    { bg: 'bg-gray-100',  text: 'text-gray-500',  label: 'Served' },
  free:      { bg: 'bg-gray-50',   text: 'text-gray-400',  label: 'Free' },
  ordering:  { bg: 'bg-gray-200',  text: 'text-gray-800',  label: 'Active' },
  waiting:   { bg: 'bg-amber-200', text: 'text-amber-800', label: 'Waiting' },
} as const