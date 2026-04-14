"use client"

import { useEffect, useState } from "react"

interface CurrentUser {
  id: string
  nama: string
  email: string
  role: string
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) return null
        return res.json()
      })
      .then((data) => {
        setUser(data)
      })
      .finally(() => setLoading(false))
  }, [])

  // Ambil nama depan saja — "Nandito Adi Syahputra" → "Nandito"
  const firstName = user?.nama?.split(" ")[0] ?? ""

  // Inisial untuk avatar — "Nandito Adi" → "NA"
  const initials = user?.nama
    ?.split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase() ?? "?"

  return { user, loading, firstName, initials }
}
