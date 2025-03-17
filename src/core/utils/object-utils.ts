export const isProxy = Symbol('isProxy');

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return isObject(value) && value.constructor === Object;
}

export function isObjectEqual(a: object, b: object): boolean {
  return (
    Object.keys(a).length === Object.keys(b).length &&
    Object.entries(a).every(([key, value]) => b[key as keyof typeof b] === value)
  );
}

export function mergeObjects(target: object, source: object) {
  for (const key in source) {
    const value = source[key as keyof typeof source] as unknown;
    if (isPlainObject(value)) {
      // @ts-expect-error No proper type
      if (!target[key]) {
        Object.assign(target, { [key]: {} });
      }
      mergeObjects(target[key as keyof typeof target], value);
    } else {
      Object.assign(target, { [key]: value });
    }
  }
}

export function getObjectValue(object: object | undefined, keys: string[]): unknown {
  let result: unknown = object;

  for (const key of keys) {
    if (!isObject(result)) {
      return undefined;
    }
    result = result[key];
  }

  return result;
}

export function setObjectValue<TObjectType extends object>(object: TObjectType, keys: string[], value: unknown) {
  let result = object;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i] as keyof typeof result;

    if (i < keys.length - 1) {
      if (!isObject(result[key])) {
        result[key] = {} as TObjectType[typeof key];
      }
      result = result[key] as TObjectType;
    } else {
      result[key] = value as TObjectType[typeof key];
    }
  }
}
