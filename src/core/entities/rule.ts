export type Rule<TValue, TContext = unknown> = (value: TValue, context?: TContext) => string | undefined;

export function checkRules<TValue, TContext, TRules extends Rule<TValue, TContext>[]>(
  rules: TRules,
  value: TValue,
  messages?: string[],
  context?: TContext,
) {
  let result = true;

  for (const rule of rules) {
    const message = rule(value, context);
    if (message) {
      result = false;
      messages?.push(message);
    }
  }

  return result;
}
