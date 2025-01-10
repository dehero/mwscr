import type { z } from 'zod';
import type { UnionToIntersection } from '../utils/type-utils.js';

export type SimpleRule<TValue, TContext = unknown, TType extends TValue = TValue> = (
  value: TValue,
  context?: TContext,
) => value is TType;

export type Rule<TValue, TContext = unknown, TType extends TValue = TValue> =
  | SimpleRule<TValue, TContext, TType>
  | z.ZodTypeAny;

type CombineRules<TValue, TContext, TRules extends Rule<TValue, TContext, TValue>[]> = UnionToIntersection<
  {
    [K in keyof TRules]: TRules[K] extends SimpleRule<TValue, TContext, infer U>
      ? U
      : TRules[K] extends z.ZodTypeAny
        ? z.infer<TRules[K]>
        : never;
  }[number]
>;

export function checkRules<TValue, TContext, TRules extends Rule<TValue, TContext, TValue>[]>(
  rules: TRules,
  value: TValue,
  messages?: string[],
  context?: TContext,
): value is TValue & CombineRules<TValue, TContext, TRules> {
  let result = true;
  for (const rule of rules) {
    if (typeof rule === 'function') {
      try {
        rule(value, context);
      } catch (error: unknown) {
        result = false;
        if (error instanceof Error) {
          messages?.push(error.message);
        }
      }
    } else {
      const { success, error } = rule.safeParse(value);
      if (!success) {
        result = false;

        const { formErrors, fieldErrors } = error.flatten();
        formErrors.forEach((error) => messages?.push(error));
        Object.entries(fieldErrors).map(
          ([field, errors]) => errors?.forEach((error) => messages?.push(`${error} for field "${field}"`)),
        );
      }
    }
  }

  return result;
}

export function needObject(value: unknown): value is Record<string, unknown> {
  const type = typeof value;

  if (!(type === 'object' && value !== null)) {
    throw new Error(`need object, got ${value === null ? 'null' : type}`);
  }
  return true;
}

export function needProperty<T>(prop: string, type: string | (new (...args: unknown[]) => unknown)) {
  return (value: unknown): value is T => {
    if (!needObject(value)) {
      return false;
    }

    const propValue = prop in value ? value[prop] : undefined;

    if (typeof type === 'string') {
      const propType = typeof propValue;
      if (propType !== type) {
        throw new Error(`need "${prop}" property of type "${type}", got "${propType}"`);
      }
    } else {
      if (!needObject(propValue)) {
        return false;
      }

      if (!(propValue instanceof type)) {
        throw new TypeError(`need "${prop}" property of type "${type.name}", got "${propValue.constructor.name}"`);
      }
    }

    return true;
  };
}
