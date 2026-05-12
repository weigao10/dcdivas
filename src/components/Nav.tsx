'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  { href: '/roster', label: 'Roster' },
  { href: '/log', label: 'Log Plays' },
  { href: '/stats', label: 'Stats' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-10 bg-[#5A1414] shadow-[0_2px_12px_rgba(90,20,20,0.35)]">
      <div className="max-w-6xl mx-auto px-4 flex items-center gap-8 h-14">
        <div className="flex flex-col leading-tight">
          <span className="font-extrabold text-base tracking-tight text-white">DC Divas</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#FFB612]">
            WR Coach
          </span>
        </div>
        <div className="flex gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                pathname.startsWith(href)
                  ? 'font-bold bg-[#FFB612] text-[#5A1414]'
                  : 'text-red-100 hover:text-white'
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
