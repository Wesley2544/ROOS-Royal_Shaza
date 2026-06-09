export default function Badge({ status }) {
  const styles = {
    new:       'bg-red-100 text-red-700',
    preparing: 'bg-amber-100 text-amber-700',
    ready:     'bg-green-100 text-green-700',
    served:    'bg-gray-100 text-gray-500',
    free:      'bg-gray-100 text-gray-500',
    ordering:  'bg-blue-100 text-blue-700',
    waiting:   'bg-amber-100 text-amber-700',
  }
  const labels = {
    new:'New', preparing:'Preparing', ready:'Ready ●',
    served:'Served', free:'Free', ordering:'Ordering', waiting:'Waiting',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-500'}`}>
      {labels[status] || status}
    </span>
  )
}// This component displays a badge with a color and label based on the order status. It uses Tailwind CSS for styling.