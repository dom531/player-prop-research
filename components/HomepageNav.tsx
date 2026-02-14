'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, BookOpen, Home, Stethoscope } from 'lucide-react'

const tabs = [
  { label: 'Betting', href: '/', icon: Home },
  { label: 'Research', href: '/research', icon: Activity },
  { label: 'Cheat Sheets', href: '#', icon: BookOpen, disabled: true },
  { label: 'Injuries', href: '#injuries', icon: Stethoscope, disabled: false },
]

export default function HomepageNav() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-20 bg-bg-secondary/95 border-b-2 border-primary-dim backdrop-blur-sm">
      <div className="container mx-auto max-w-6xl px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = pathname === tab.href

            if (tab.disabled) {
              return (
                <span
                  key={tab.label}
                  className="inline-flex items-center gap-2 border border-primary-dim/30 px-4 py-2 text-text-dim opacity-60"
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </span>
              )
            }

            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={`inline-flex items-center gap-2 border px-4 py-2 transition-all ${
                  isActive
                    ? 'border-primary bg-primary text-bg-primary'
                    : 'border-primary-dim text-text-secondary hover:border-primary hover:text-primary'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
