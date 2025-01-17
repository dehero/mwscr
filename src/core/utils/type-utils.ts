export type AugmentedRequired<T extends object, K extends keyof T = keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never;

export type UndefinedToNull<T> = T extends undefined ? T | null : T;

export type UndefinedPropsToNull<T> = { [K in keyof T]: UndefinedToNull<T[K]> };
