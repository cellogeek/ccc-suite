'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BookOpen, 
  Music, 
  Settings, 
  Library, 
  Download,
  Home
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/scripture', label: 'Scripture', icon: BookOpen },
  { href: '/songs', label: 'Songs', icon: Music },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/export', label: 'Export', icon: Download },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="glass-card mx-4 mt-4 p-4">
      <div className="flex items-center justify-center space-x-1 md:space-x-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-primary-100/80 text-primary-800 shadow-soft' 
                  : 'text-accent-600 hover:bg-primary-50/50 hover:text-primary-700'
                }
              `}
            >
              <Icon size={18} />
              <span className="hidden sm:inline text-sm font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}