import type {
  BaseIssue,
  BaseSchema,
  InferOutput,
  IssuePathItem,
  ObjectSchema as ValibotObjectSchema,
  RecordSchema as ValibotRecordSchema,
} from 'valibot';
import { is, safeParse } from 'valibot';
import { listItems, partition, uncapitalizeFirstLetter } from '../utils/common-utils.js';
import { getFieldTitle } from './field.js';

export type Schema<TOutput> = BaseSchema<unknown, TOutput, BaseIssue<unknown>>;

export type ObjectSchema<TOutput extends object> = ValibotObjectSchema<
  Record<string, Schema<TOutput[keyof TOutput]>>,
  undefined
>;

export type RecordSchema<TKey extends string | number | symbol, TValue> = ValibotRecordSchema<
  BaseSchema<string, TKey, BaseIssue<unknown>>,
  Schema<TValue>,
  undefined
>;

export function parseSchema<TSchema extends Schema<unknown>>(
  schema: TSchema,
  input: unknown,
  errorMessage?: string | ((message: string) => string),
): InferOutput<TSchema> {
  const messages: string[] = [];
  const output = safeParseSchema(schema, input, messages);

  if (messages.length > 0) {
    const message = messages.map((message) => uncapitalizeFirstLetter(message)).join(', ');
    throw new Error(typeof errorMessage === 'function' ? errorMessage(message) : message);
  }

  return output;
}

// TODO: remove this function usages in order to use `safeParse` directly and show errors on fail
export function safeParseSchema<TSchema extends Schema<unknown>>(
  schema: TSchema,
  input: unknown,
  messages?: string[],
): InferOutput<TSchema> | undefined {
  const { success, issues, output } = safeParse(schema, input);

  if (success) {
    return output;
  }

  messages?.push(...validbotIssuesToMessages(issues));

  return undefined;
}

export function checkSchema<TSchema extends Schema<unknown>>(
  schema: TSchema,
  input: unknown,
  messages?: string[],
): input is InferOutput<TSchema> {
  if (!messages) {
    return is(schema, input);
  }

  const schemaMessages: string[] = [];
  safeParseSchema(schema, input, schemaMessages);

  if (schemaMessages.length > 0) {
    messages.push(...schemaMessages);
    return false;
  }

  return true;
}

export function assertSchema<TSchema extends Schema<unknown>>(
  schema: TSchema,
  input: unknown,
  errorMessage?: string | ((message: string) => string),
): asserts input is InferOutput<TSchema> {
  parseSchema(schema, input, errorMessage);
}

function getFieldTitleFromPath(path: IssuePathItem[] | undefined) {
  return path?.map((item) => uncapitalizeFirstLetter(getFieldTitle(String(item.key)))).join(' in ');
}

function validbotIssuesToMessages(issues: BaseIssue<unknown>[], path?: BaseIssue<unknown>['path']): string[] {
  const messages: Set<string> = new Set();

  let [outputIssues, restIssues] = partition(issues, (issue) => issue.type === 'union');

  if (outputIssues.length > 0) {
    for (const issue of outputIssues) {
      messages.add(listItems(validbotIssuesToMessages(issue.issues ?? [], issue.path ?? path)));
    }
  }

  [outputIssues, restIssues] = partition(
    restIssues,
    (issue) => issue.kind === 'schema' && issue.received === typeof undefined,
  );

  if (outputIssues.length > 0) {
    const fields = new Set(outputIssues.map((issue) => getFieldTitleFromPath(issue.path ?? path)));
    messages.add(`missing ${[...fields].join(', ')}`);
  }

  [outputIssues, restIssues] = partition(restIssues, (issue) => issue.kind === 'schema');

  for (const issue of outputIssues) {
    messages.add(
      `${getFieldTitleFromPath(issue.path ?? path)} ${uncapitalizeFirstLetter(
        issue.message,
      )}, got ${uncapitalizeFirstLetter(issue.received)}`,
    );
  }

  for (const issue of restIssues) {
    messages.add(
      [getFieldTitleFromPath(issue.path ?? path), uncapitalizeFirstLetter(issue.message)].filter(Boolean).join(' '),
    );
  }

  return [...messages];
}
