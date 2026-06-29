'use client'
import { useState } from 'react'

interface Props { onClick: () => void; label?: string }

export default function RefreshButton({ onClick, label = 'Refresh' }: Props) {
  const [spinning, setSpinning] = useState(false)
  const [justRefreshed, setJustRefreshed] = useState(false)

  function handleClick() {
    if (spinning) return
    setSpinning(true)
    onClick()

    setTimeout(() => {
      setSpinning(false)
      setJustRefreshed(true)
      setTimeout(() => setJustRefreshed(false), 1500)
    }, 600)
  }

  return (
    <button
      onClick={handleClick}
      disabled={spinning}
      className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold transition-all
        ${justRefreshed
          ? 'border-green-300 bg-green-100 text-green-800'
          : 'border-[#E5E5E5] text-[#0A0A0A] hover:bg-[#F5F5F5]'
        }
        ${spinning ? 'opacity-70 cursor-wait' : ''}
      `}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`w-3.5 h-3.5 transition-transform ${spinning ? 'animate-spin' : ''}`}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      >
        {justRefreshed ? (
          <polyline points="20 6 9 17 4 12" />
        ) : (
          <>
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <polyline points="21 3 21 9 15 9" />
          </>
        )}
      </svg>
      {justRefreshed ? 'Updated' : label}
    </button>
  )
}