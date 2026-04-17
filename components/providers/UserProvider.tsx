"use client"

import { createContext, useEffect, useState } from "react"

interface CurrentUser {
  id: string
  nama: string
  email: string
  role: string
}

interface UserContextValue {
  user: CurrentUser | null
  loading: boolean
}

export const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
})

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  )
}
