'use client'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  id?: string
}

export default function PasswordInput({ value, onChange, placeholder, required, id }: Props) {
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeOff : Eye
  const label = visible ? 'Hide password' : 'Show password'

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 pr-10 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]"
      />
      <button
        type="button"
        onClick={() => setVisible(current => !current)}
        tabIndex={-1}
        aria-label={label}
        title={label}
        className="absolute right-0 top-0 h-full px-3 flex items-center text-gray-400 hover:text-[#0A0A0A]"
      >
        <Icon className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  )
}
