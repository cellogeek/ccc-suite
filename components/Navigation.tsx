'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Book, Library, Download, Settings, Music, Calendar, Presentation } from 'lucide-react'
import AuthButton from './AuthButton'

export default function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/scripture', label: 'Scripture', icon: Book },
    { href: '/library', label: 'Library', icon: Library },
    { href: '/songs', label: 'Songs', icon: Music },
    { href: '/setlists', label: 'Setlists', icon: Calendar },
    { href: '/presentations', label: 'Presentations', icon: Presentation },
    { href: '/export', label: 'Export', icon: Download },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              CCC Suite
            </Link>
            <div className="hidden md:flex space-x-6">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === href
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
          <AuthButton />
        </div>
      </div>
    </nav>
  )
}