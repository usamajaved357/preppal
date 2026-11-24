import type { ErrorHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';
import type { AppEnv } from '../env';

/** Throw anywhere in a handler; the global handler turns it into { error: { code, message } }. */
export class HttpError extends Error {
  constructor(
    public status: ContentfulStatusCode,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what: string) => new HttpError(404, 'not_found', `${what} not found`);
export const badRequest = (code: string, message: string, details?: unknown) =>
  new HttpError(400, code, message, details);

export const onError: ErrorHandler<AppEnv> = (err, c) => {
  if (err instanceof HttpError) {
    return c.json({ error: { code: err.code, message: err.message, details: err.details } }, err.status);
  }
  if (err instanceof ZodError) {
    return c.json(
      { error: { code: 'validation_error', message: 'Invalid input', details: err.issues } },
      400,
    );
  }
  console.error('Unhandled error', err);
  return c.json({ error: { code: 'internal_error', message: 'Something went wrong' } }, 500);
};
