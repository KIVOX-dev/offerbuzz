export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (msg: string, code = 'BAD_REQUEST') => new HttpError(400, code, msg);
export const unauthorized = (msg = 'Authentication required', code = 'UNAUTHORIZED') => new HttpError(401, code, msg);
export const forbidden = (msg = 'You do not have access to this resource', code = 'FORBIDDEN') =>
  new HttpError(403, code, msg);
export const notFound = (msg = 'Not found') => new HttpError(404, 'NOT_FOUND', msg);
export const tooMany = (msg: string) => new HttpError(429, 'RATE_LIMITED', msg);
