export const isNonNullish = <T>(value: T): value is NonNullable<T> => value != null;
