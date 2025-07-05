'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { User, LogIn, LogOut } from 'lucide-react'

export default function AuthButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center space-x-2 px-4 py-2 text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>Loading...</span>
      </div>
    )
  }

  if (session) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-gray-700">
          <User size={18} />
          <span className="hidden sm:inline">{session.user?.name || session.user?.email}</span>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn()}
      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      <LogIn size={18} />
      <span>Sign In</span>
    </button>
  )
}