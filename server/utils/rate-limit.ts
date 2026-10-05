interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

/**
 * Process-local rate limiting. It protects a single Nuxt instance immediately.
 * Replace this with a shared Redis/KV counter before horizontally scaling.
 */
export function enforceRateLimit(scope: string, identity: string, limit: number, windowMs: number) {
  const now = Date.now()
  const key = `${scope}:${identity}`
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return
  }
  if (bucket.count >= limit) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests. Please wait a moment and try again.' })
  }
  bucket.count += 1
}
