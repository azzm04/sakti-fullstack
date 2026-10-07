/**
 * lib/rate-limit.ts
 * Rate limiter fixed-window di memori proses.
 *
 * Cukup untuk deployment satu instance (VPS + pm2 satu proses). Kalau nanti
 * berjalan lebih dari satu instance, pindahkan penyimpanan ke database/Redis.
 */

interface Bucket {
  count: number
  resetAt: number
}

export interface RateLimiter {
  /** Tambah hitungan untuk key; false jika batas sudah terlewati. */
  hit(key: string): boolean
  /** Cek tanpa menambah hitungan. */
  isLimited(key: string): boolean
}

export function createRateLimiter(limit: number, windowMs: number): RateLimiter {
  const buckets = new Map<string, Bucket>()

  function current(key: string, now: number): Bucket | undefined {
    const bucket = buckets.get(key)
    if (bucket && bucket.resetAt <= now) {
      buckets.delete(key)
      return undefined
    }
    return bucket
  }

  function sweep(now: number) {
    // Bersihkan bucket kedaluwarsa sesekali agar Map tidak tumbuh tanpa batas
    if (buckets.size < 1000) return
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key)
    }
  }

  return {
    hit(key) {
      const now = Date.now()
      sweep(now)
      const bucket = current(key, now)
      if (!bucket) {
        buckets.set(key, { count: 1, resetAt: now + windowMs })
        return true
      }
      bucket.count++
      return bucket.count <= limit
    },
    isLimited(key) {
      const bucket = current(key, Date.now())
      return !!bucket && bucket.count >= limit
    },
  }
}

/**
 * Set dengan TTL — dipakai untuk deduplikasi update_id Telegram.
 */
export function createTtlSet(ttlMs: number) {
  const entries = new Map<string, number>()
  return {
    /** true jika key baru (belum pernah dilihat dalam TTL). */
    add(key: string): boolean {
      const now = Date.now()
      if (entries.size >= 5000) {
        for (const [k, exp] of entries) if (exp <= now) entries.delete(k)
      }
      const exp = entries.get(key)
      if (exp && exp > now) return false
      entries.set(key, now + ttlMs)
      return true
    },
  }
}
