import { z } from 'zod';
import { partition, uncapitalizeFirstLetter } from '../utils/common-utils.js';
import type { UnionToIntersection } from '../utils/type-utils.js';
import { getFieldTitle } from './field.js';

export type SimpleRule<TValue, TContext = unknown, TType extends TValue = TValue> = (
  value: TValue,
  context?: TContext,
) => value is TType;

export type Rule<TValue, TContext = unknown, TType extends TValue = TValue> =
  | SimpleRule<TValue, TContext, TType>
  | z.ZodType<TValue>;

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

        const issues = error.issues.flatMap((issue) =>
          issue.code === z.ZodIssueCode.invalid_union ? issue.unionErrors.flatMap((e) => e.issues) : [issue],
        );

        const [outputIssues, restIssues] = partition(
          issues,
          (issue) => issue.code === z.ZodIssueCode.invalid_type && issue.received === typeof undefined,
        );

        if (outputIssues.length > 0) {
          const titles = new Set(outputIssues.map((issue) => getFieldTitleFromPath(issue.path)));
          messages?.push(`Need ${[...titles].join(', ')}`);
        }

        messages?.push(
          ...restIssues.map((issue) =>
            [getFieldTitleFromPath(issue.path), uncapitalizeFirstLetter(issue.message)].filter(Boolean).join(' '),
          ),
        );

        // const { formErrors, fieldErrors } = error.flatten();
        // formErrors.forEach((error) => messages?.push(error));
        // Object.entries(fieldErrors).map(
        //   ([field, errors]) => errors?.forEach((error) => messages?.push(`${error} for field "${field}"`)),
        // );
      }
    }
  }

  return result;
}

function getFieldTitleFromPath(path: Array<string | number>) {
  return path.map((field) => uncapitalizeFirstLetter(getFieldTitle(field))).join(' in ');
}
