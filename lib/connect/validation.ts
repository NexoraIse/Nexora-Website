export const CONNECT_SUPPORT_EMAIL = 'nexora.ise@ajiet.edu.in'

export class ConnectRequestError extends Error {
  constructor(
    message: string,
    public readonly status = 400
  ) {
    super(message)
    this.name = 'ConnectRequestError'
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export async function readJsonObject(
  req: Request,
  maxBytes = 32 * 1024
): Promise<Record<string, unknown>> {
  const contentLength = Number(req.headers.get('content-length') ?? 0)
  if (contentLength > maxBytes) {
    throw new ConnectRequestError('Request body is too large.', 413)
  }

  if (!req.body) {
    throw new ConnectRequestError('A JSON request body is required.')
  }

  const reader = req.body.getReader()
  const decoder = new TextDecoder()
  let text = ''
  let size = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength

    if (size > maxBytes) {
      await reader.cancel()
      throw new ConnectRequestError('Request body is too large.', 413)
    }

    text += decoder.decode(value, { stream: true })
  }

  text += decoder.decode()

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new ConnectRequestError('Request body must contain valid JSON.')
  }

  if (!isRecord(parsed)) {
    throw new ConnectRequestError('Request body must be a JSON object.')
  }

  return parsed
}

export function requiredString(
  value: unknown,
  field: string,
  maxLength: number,
  minLength = 1
): string {
  if (typeof value !== 'string') {
    throw new ConnectRequestError(`${field} must be a string.`)
  }

  const normalized = value.trim()
  if (normalized.length < minLength || normalized.length > maxLength) {
    throw new ConnectRequestError(`${field} must be between ${minLength} and ${maxLength} characters.`)
  }

  return normalized
}

export function optionalString(
  value: unknown,
  field: string,
  maxLength: number
): string | null {
  if (value === undefined || value === null || value === '') return null
  return requiredString(value, field, maxLength)
}

export function optionalEmail(value: unknown, field: string): string | null {
  const email = optionalString(value, field, 320)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ConnectRequestError(`${field} must be a valid email address.`)
  }
  return email
}

export function stringArray(
  value: unknown,
  field: string,
  maxItems = 30,
  maxItemLength = 60
): string[] {
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new ConnectRequestError(`${field} must contain no more than ${maxItems} items.`)
  }

  return value.map((item, index) =>
    requiredString(item, `${field}[${index}]`, maxItemLength)
  )
}

export function booleanValue(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw new ConnectRequestError(`${field} must be a boolean.`)
  }
  return value
}

export function integerValue(
  value: unknown,
  field: string,
  min: number,
  max: number
): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new ConnectRequestError(`${field} must be an integer between ${min} and ${max}.`)
  }
  return value
}

export function uuidString(value: unknown, field: string): string {
  const id = requiredString(value, field, 36)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new ConnectRequestError(`${field} must be a valid UUID.`)
  }
  return id
}

export function optionalDate(value: unknown, field: string): Date | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ConnectRequestError(`${field} must be a date in YYYY-MM-DD format.`)
  }

  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new ConnectRequestError(`${field} must be a valid calendar date.`)
  }
  return parsed
}

export function normalizeUsn(value: unknown): string {
  return requiredString(value, 'USN', 20, 3)
    .normalize('NFKC')
    .replace(/\s+/g, '')
    .toUpperCase()
}

export function normalizeSignupUsn(value: unknown): string {
  try {
    return normalizeUsn(value)
  } catch (error) {
    if (error instanceof ConnectRequestError) {
      throw new ConnectRequestError(
        `Enter a valid USN or contact ${CONNECT_SUPPORT_EMAIL} if you think this is a mistake.`
      )
    }
    throw error
  }
}

export function normalizePersonName(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en')
}

export function validatedHttpUrl(value: unknown, field: string): string {
  const input = requiredString(value, field, 2048)
  let url: URL

  try {
    url = new URL(input)
  } catch {
    throw new ConnectRequestError(`${field} must be a valid URL.`)
  }

  if (
    (url.protocol !== 'https:' && url.protocol !== 'http:') ||
    url.username ||
    url.password
  ) {
    throw new ConnectRequestError(`${field} must be an HTTP or HTTPS URL without credentials.`)
  }

  return url.toString()
}

export function requestErrorResponse(error: unknown) {
  if (error instanceof ConnectRequestError) {
    return Response.json({ error: error.message }, { status: error.status })
  }
  return null
}

export function rethrowNextControlFlow(error: unknown): void {
  if (error !== null && typeof error === 'object' && 'digest' in error) {
    throw error
  }
}
