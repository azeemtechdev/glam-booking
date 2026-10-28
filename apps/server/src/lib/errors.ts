import type { z } from 'zod'

// Every error leaves the server as { error: { code, message } }; the message is shown to the user as-is.
export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
  }
}

export const badRequest = (code: string, message: string) => new HttpError(400, code, message)
export const unauthorized = (message = 'Please sign in again.', code = 'UNAUTHORIZED') => new HttpError(401, code, message)
export const forbidden = (message = 'You do not have access to this.', code = 'FORBIDDEN') => new HttpError(403, code, message)
export const notFound = (what = 'That item') => new HttpError(404, 'NOT_FOUND', `${what} could not be found.`)
export const conflict = (code: string, message: string) => new HttpError(409, code, message)
export const invalid = (code: string, message: string) => new HttpError(422, code, message)

// Validates input with a zod schema; failures become a 422 with a readable message.
export function parse<S extends z.ZodType>(schema: S, data: unknown): z.infer<S> {
  const r = schema.safeParse(data ?? {})
  if (r.success) return r.data
  const issue = r.error.issues[0]
  const field = issue?.path.join('.')
  throw invalid('VALIDATION', field ? `Please check ${field.replace(/_/g, ' ')}: ${issue!.message}` : issue?.message ?? 'Invalid input.')
}
