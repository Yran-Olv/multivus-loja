const SHORT_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export const ACTIVATION_SHORT_PATH = "/r"

export function generateActivationShortCode(length = 8): string {
  let out = ""
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * SHORT_CODE_CHARS.length)
    out += SHORT_CODE_CHARS[idx]
  }
  return out
}

export function buildActivationShortUrl(
  shortCode: string,
  baseUrl?: string | null
): string {
  const code = String(shortCode || "").trim()
  if (!code) return ""

  const root = String(
    baseUrl || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_DOMAIN || ""
  )
    .trim()
    .replace(/\/$/, "")

  if (!root) return `${ACTIVATION_SHORT_PATH}/${code}`
  return `${root}${ACTIVATION_SHORT_PATH}/${code}`
}
