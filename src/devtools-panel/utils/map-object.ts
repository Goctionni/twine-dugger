/** The same properties, each value replaced by what `map` makes of it */
export function mapObject<T extends Record<string, unknown>, R>(
  obj: T,
  map: (value: T[keyof T], key: keyof T & string) => R,
) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      map(value as T[keyof T], key as keyof T & string),
    ]),
  ) as { [K in keyof T]: R };
}
