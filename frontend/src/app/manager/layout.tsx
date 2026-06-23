'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const NAV_ITEMS = [
  { href: '/manager',         label: 'Dashboard', icon: '📊' },
  { href: '/manager/menu',    label: 'Menu',      icon: '🍽' },
  { href: '/manager/orders',  label: 'Orders',    icon: '🛒' },
  { href: '/manager/staff',   label: 'Staff',     icon: '👥' },
  { href: '/manager/reports', label: 'Reports',   icon: '📈' },
]

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth('manager')
  const router   = useRouter()
  const pathname = usePathname()

  if (loading || !user) return <LoadingSpinner message="Checking access…" />

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
      <aside className="w-44 bg-[#F5F9FE] border-r border-[#E0EAF5] flex-shrink-0 min-h-screen flex flex-col">
        <div className="px-4 py-4 border-b border-[#E0EAF5]">
          <div className="text-sm font-bold text-[#1A3C5E]">Royal Shaza Suites</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Manager portal</div>
        </div>

        <nav className="flex-1 py-2">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left
                  ${active
                    ? 'bg-white text-[#185FA5] font-semibold border-r-[3px] border-[#185FA5]'
                    : 'text-gray-500 hover:bg-white/60'
                  }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="px-4 py-3 border-t border-[#E0EAF5]">
          <button
            onClick={logout}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}