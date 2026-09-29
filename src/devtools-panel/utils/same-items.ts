/** Whether two arrays hold the same items, in the same order (for the `equals` of a memo) */
export const sameItems = <T>(a: readonly T[], b: readonly T[]) =>
  a.length === b.length && a.every((item, index) => item === b[index]);
