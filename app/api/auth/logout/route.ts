import { NextResponse } from "next/server"

export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete("sakti_token")
  return res
}
