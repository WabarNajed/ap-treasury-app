"use client"

import { useEffect } from "react"

export default function Page() {
  useEffect(() => {
    window.location.replace("/najm.html")
  }, [])
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F9F8] text-[#006C5B]">
      <p className="text-sm font-medium">Loading Najm AP &amp; Treasury Payment Control Center…</p>
    </main>
  )
}
