import { z } from 'zod';

export function matchesSChema<T extends z.ZodType>(value: unknown, schema: T): value is z.Infer<T> {
  return schema.safeParse(value).success;
}

export function isObj(value: unknown): value is object {
  return !!value && typeof value === 'object';
}
