"use client"

import { useContext } from "react"
import { UserContext } from "@/components/providers/UserProvider"

export function useCurrentUser() {
  const ctx = useContext(UserContext)

  const firstName = ctx.user?.nama?.split(" ")[0] ?? ""
  const initials = ctx.user?.nama
    ?.split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase() ?? "?"

  return { ...ctx, firstName, initials }
}
