import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthSessionProvider from "../components/SessionProvider";
import Navigation from "../components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthSessionProvider>
          <Navigation />
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
