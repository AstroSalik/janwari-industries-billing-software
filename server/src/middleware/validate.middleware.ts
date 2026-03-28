import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Zod validation middleware factory
 * Validates request body, query, or params against a Zod schema
 */
export function validate(schema: z.ZodType, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const formattedErrors = result.error.issues.map((issue: any) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: formattedErrors,
      });
      return;
    }

    req[source] = result.data;
    next();
  };
}
