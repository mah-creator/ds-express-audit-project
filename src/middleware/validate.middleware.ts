import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';

export const validate = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      // Forward the raw ZodError to next() so ds-express-errors' zodMapper
      // formats it, instead of dumping the raw ZodError object to the client.
      return next(error);
    }
  };
};
