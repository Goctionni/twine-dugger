import { type, type Type } from 'arktype';

/** Parses JSON, and throws when it isn't valid JSON or doesn't match the schema */
export function fromJson<T extends Type<any>>(json: string, schema: T): T['infer'] {
  const result = schema(JSON.parse(json));
  if (result instanceof type.errors) throw new Error(result.summary);
  return result;
}
