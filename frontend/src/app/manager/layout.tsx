'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const NAV_ITEMS = [
  {
    href: '/manager',
    label: 'Dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1"/>
        <rect x="14" y="3" width="7" height="5" rx="1"/>
        <rect x="14" y="12" width="7" height="9" rx="1"/>
        <rect x="3" y="16" width="7" height="5" rx="1"/>
      </svg>
    ),
  },
  {
    href: '/manager/menu',
    label: 'Menu',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2"/>
        <path d="M7 2v20"/>
        <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
      </svg>
    ),
  },
  {
    href: '/manager/orders',
    label: 'Orders',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2h12l1 5H5l1-5Z"/>
        <path d="M4 7h16l-1.4 12.6a2 2 0 0 1-2 1.4H7.4a2 2 0 0 1-2-1.4L4 7Z"/>
        <path d="M9 11v4M15 11v4"/>
      </svg>
    ),
  },
  {
    href: '/manager/staff',
    label: 'Staff',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/>
        <circle cx="10" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: '/manager/reports',
    label: 'Reports',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18"/>
        <path d="M18.7 8 13 13.7l-3-3L7 13.5"/>
      </svg>
    ),
  },
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
                <span className={active ? 'text-[#185FA5]' : 'text-gray-400'}>
                  {item.icon}
                </span>
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