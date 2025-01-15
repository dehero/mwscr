import type { BaseIssue, BaseSchema } from 'valibot';
import { safeParse } from 'valibot';

// TODO: remove this function usages in order to use `safeParse` directly and show errors on fail
export function safeParseOutput<const TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>>(
  schema: TSchema,
  input: unknown,
) {
  const { success, output } = safeParse(schema, input);

  if (success) {
    return output;
  }

  return undefined;
}
