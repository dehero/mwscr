import { nullable, object, partial } from 'valibot';
import { isPlainObject } from '../utils/object-utils.js';
import type { UndefinedToNull } from '../utils/type-utils.js';
import type { ObjectSchema, Schema } from './schema.js';

export type Patch<T> = Partial<{
  [K in keyof T]: T[K] extends Array<infer U> | undefined ? Array<Patch<U>> | null : UndefinedToNull<T[K]>;
}>;

export function Patch<T extends object>(schema: ObjectSchema<T>) {
  return partial(
    object(
      Object.fromEntries(
        Object.entries(schema.entries).map(([key, value]) => {
          let schema;
          let baseSchema = 'wrapped' in value ? (value.wrapped as Schema<unknown>) : value;

          if (baseSchema.type === 'object') {
            baseSchema = Patch(baseSchema as ObjectSchema<object>);
          }

          if (value.type === 'optional') {
            schema = nullable(baseSchema);
          } else {
            schema = baseSchema;
          }

          return [key, schema];
        }),
      ),
    ),
  ) as Schema<Patch<T>>;
}

export function patchObject<T extends object>(target: T, patch: Patch<T>) {
  for (const key of Object.getOwnPropertyNames(patch)) {
    const oldValue = target[key as keyof T] as unknown;
    const newValue = patch[key as keyof T] as unknown;

    if ((isPlainObject(oldValue) || Array.isArray(oldValue)) && isPlainObject(newValue)) {
      patchObject(oldValue, newValue);
    } else if (newValue === null) {
      delete target[key as keyof T];
    } else if (isPlainObject(newValue)) {
      target[key as keyof T] = {} as T[keyof T];
      patchObject(target[key as keyof T] as object, newValue);
    } else {
      target[key as keyof T] = newValue as T[keyof T];
    }
  }
}
