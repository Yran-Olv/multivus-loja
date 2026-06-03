export function formatDbError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

/** Serializa Date para props de Client Components */
export function toIsoDate(value: Date | string | null | undefined): string {
  if (!value) return new Date(0).toISOString()
  if (value instanceof Date) return value.toISOString()
  return String(value)
}
