import bcrypt from "bcryptjs"
import crypto from "crypto"

// Generate kode OTP 6 digit acak
export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString()
}

// Hash OTP sebelum disimpan ke database
export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10)
}

// Verifikasi kode OTP yang diinput user vs hash di DB
export async function verifyOtp(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed)
}
