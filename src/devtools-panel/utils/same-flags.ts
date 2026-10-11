/** Whether two objects with the same keys have the (primitive) values at those keys */
export const sameFlags = <T extends object>(a: T, b: T) =>
  (Object.keys(a) as Array<keyof T>).every((key) => a[key] === b[key]);
