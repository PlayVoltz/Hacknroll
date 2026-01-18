export class HttpError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export function badRequest(code: string, message: string, details?: unknown) {
  return new HttpError(400, code, message, details)
}

export function unauthorized(message = "Unauthorized") {
  return new HttpError(401, "unauthorized", message)
}

export function forbidden(message = "Forbidden") {
  return new HttpError(403, "forbidden", message)
}

export function notFound(message = "Not found") {
  return new HttpError(404, "not_found", message)
}

export function tooManyRequests(message = "Too many requests") {
  return new HttpError(429, "rate_limited", message)
}


