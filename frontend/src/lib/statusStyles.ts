export const STATUS = {
  new:       { bg: 'bg-red-200',   text: 'text-red-800',   label: 'Sent' },
  preparing: { bg: 'bg-amber-200', text: 'text-amber-800', label: 'Received' },
  ready:     { bg: 'bg-amber-200', text: 'text-amber-800', label: 'Received' },
  served:    { bg: 'bg-gray-100',  text: 'text-gray-500',  label: 'Served' },
  free:      { bg: 'bg-gray-50',   text: 'text-gray-400',  label: 'Free' },
  ordering:  { bg: 'bg-gray-200',  text: 'text-gray-800',  label: 'Active' },
  waiting:   { bg: 'bg-amber-200', text: 'text-amber-800', label: 'Waiting' },
} as const