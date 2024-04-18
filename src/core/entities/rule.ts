import type { UnionToIntersection } from '../utils/type-utils.js';

export type Rule<TValue, TContext = unknown, TType extends TValue = TValue> = (
  value: TValue,
  context?: TContext,
) => value is TType;

type CombineRules<TValue, TContext, TRules extends Rule<TValue, TContext, TValue>[]> = UnionToIntersection<
  {
    [K in keyof TRules]: TRules[K] extends Rule<TValue, TContext, infer U> ? U : never;
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
    try {
      rule(value, context);
    } catch (error: unknown) {
      result = false;
      if (error instanceof Error) {
        messages?.push(error.message);
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
