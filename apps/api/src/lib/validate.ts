import { zValidator } from '@hono/zod-validator';
import type { ValidationTargets } from 'hono';
import type { ZodType } from 'zod';
import { HttpError } from './errors';

/** zValidator that reports failures in our standard error shape. */
export const validate = <T extends ZodType, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T,
) =>
  zValidator(target, schema, (result) => {
    if (!result.success) {
      throw new HttpError(400, 'validation_error', 'Invalid input', result.error.issues);
    }
  });
