export type AugmentedRequired<T extends object, K extends keyof T = keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never;

export type UndefinedToNull<T> = T extends undefined ? T | null : T;

export type Immutable<T> = T extends unknown ? T : Readonly<T>;

export type NestedKeyOf<TObjectType extends object> = {
  [Key in keyof TObjectType & (string | number)]: TObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<TObjectType[Key]>}`
    : `${Key}`;
}[keyof TObjectType & (string | number)];
