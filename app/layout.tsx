import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Sumatra Web — Focused document reading",
  description: "A fast, focused PDF reader for Android and the web.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
