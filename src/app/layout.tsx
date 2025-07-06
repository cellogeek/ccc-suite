import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Navigation from '../components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "CCC Suite - Canyon Country Freewill Baptist Church",
  description: "Scripture presentation and media tools for Canyon Country Freewill Baptist Church",
  keywords: "scripture, presentation, church, media, slides, ProPresenter, CCC",
  authors: [{ name: "Canyon Country Freewill Baptist Church Media Team" }],
  icons: {
    icon: "/1.jpg",
    apple: "/1.jpg",
  },
};

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Navigation from '../components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CCC Suite - Church Media Tools',
  description: 'Professional church media tools for scripture slides and presentations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (

Html
) }
