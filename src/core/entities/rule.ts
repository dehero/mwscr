import type { BaseIssue, BaseSchema, InferOutput, IssuePathItem } from 'valibot';
import { isValiError, parse } from 'valibot';
import { partition, uncapitalizeFirstLetter } from '../utils/common-utils.js';
import type { UnionToIntersection } from '../utils/type-utils.js';
import { getFieldTitle } from './field.js';

export type FunctionalRule<TValue, TContext = unknown, TType extends TValue = TValue> = (
  value: TValue,
  context?: TContext,
) => value is TType;

export type ValibotRule<TType> = BaseSchema<unknown, TType, BaseIssue<unknown>>;

export type Rule<TValue, TContext = unknown, TType extends TValue = TValue> =
  | FunctionalRule<TValue, TContext, TType>
  | ValibotRule<TValue>;

type CombineRules<TValue, TContext, TRules extends Rule<TValue, TContext, TValue>[]> = UnionToIntersection<
  {
    [K in keyof TRules]: TRules[K] extends FunctionalRule<TValue, TContext, infer U>
      ? U
      : TRules[K] extends ValibotRule<TValue>
        ? InferOutput<TRules[K]>
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
      try {
        parse(rule, value);
      } catch (error: unknown) {
        result = false;
        if (isValiError(error)) {
          messages?.push(...validbotIssuesToMessages(error.issues));
        }
      }
    }
  }

  return result;
}

export function assertRules<TValue, TContext, TRules extends Rule<TValue, TContext, TValue>[]>(
  rules: TRules,
  value: TValue,
  errorMessage?: string | ((message: string) => string),
  context?: TContext,
): asserts value is TValue & CombineRules<TValue, TContext, TRules> {
  const messages: string[] = [];
  const result = checkRules(rules, value, messages, context);

  if (!result) {
    const message = messages.map((message) => uncapitalizeFirstLetter(message)).join(', ');
    throw new Error(typeof errorMessage === 'function' ? errorMessage(message) : message);
  }
}

function getFieldTitleFromPath(path: IssuePathItem[] | undefined) {
  return path?.map((item) => uncapitalizeFirstLetter(getFieldTitle(String(item.key)))).join(' in ');
}

function validbotIssuesToMessages(issues: BaseIssue<unknown>[]): string[] {
  const messages: string[] = [];

  let [outputIssues, restIssues] = partition(
    issues,
    (issue) => issue.kind === 'schema' && issue.received === typeof undefined,
  );

  if (outputIssues.length > 0) {
    messages.push(`missing ${outputIssues.map((issue) => getFieldTitleFromPath(issue.path)).join(', ')}`);
  }

  [outputIssues, restIssues] = partition(restIssues, (issue) => issue.kind === 'schema');

  messages.push(
    ...outputIssues.map(
      (issue) =>
        `${getFieldTitleFromPath(issue.path)} ${uncapitalizeFirstLetter(issue.message)}, got ${uncapitalizeFirstLetter(
          issue.received,
        )}`,
    ),
    ...restIssues.map((issue) =>
      [getFieldTitleFromPath(issue.path), uncapitalizeFirstLetter(issue.message)].filter(Boolean).join(' '),
    ),
  );

  return messages;
}
