import { z, ZodType } from 'zod';
import { Primitive } from './content-script/util/types';

export function isZodDef<TDef extends ZodType<any, any, any>>(
  value: unknown,
  def: TDef,
): value is z.infer<TDef> {
  return def.safeParse(value).success;
}

export function get<T = unknown>(obj: object, path: string[]): T | undefined {
  let item: object | Primitive = { ...obj };
  const workingPath = path.slice();
  while (workingPath.length) {
    if (!item || typeof item !== 'object') break;
    const slug = workingPath.shift() as keyof typeof item;
    if (!(slug in item)) return undefined;
    item = item[slug];
  }
  if (workingPath.length) return undefined;
  return item as T;
}
