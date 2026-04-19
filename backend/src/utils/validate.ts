import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { z, type ZodTypeAny } from 'zod';

const segmentSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9_-]+$/i, 'segment must be alphanumeric with _ or -');

export const subscribeBodySchema = z.object({
  playerId: z.string().trim().min(1).max(256),
  segment: z.preprocess(
    (v) => (v === null || v === undefined || (typeof v === 'string' && v.trim() === '') ? undefined : v),
    segmentSchema.optional().default('general'),
  ),
});

export const unsubscribeBodySchema = z.object({
  playerId: z.string().trim().min(1).max(256),
});

export const playerIdParamSchema = z.object({
  playerId: z.string().trim().min(1).max(256),
});

export const sendBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(4000),
  url: z.string().trim().url().max(2000),
  segment: segmentSchema.optional().nullable(),
});

export type SubscribeBody = z.infer<typeof subscribeBodySchema>;
export type UnsubscribeBody = z.infer<typeof unsubscribeBodySchema>;
export type SendBody = z.infer<typeof sendBodySchema>;
export type PlayerIdParams = z.infer<typeof playerIdParamSchema>;

export function parseBody<T extends ZodTypeAny>(schema: T): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', issues: parsed.error.flatten() });
      return;
    }
    (req as Request & { validated: z.infer<T> }).validated = parsed.data;
    next();
  };
}

export function parseParams<T extends ZodTypeAny>(schema: T): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', issues: parsed.error.flatten() });
      return;
    }
    (req as Request & { validatedParams: z.infer<T> }).validatedParams = parsed.data;
    next();
  };
}
