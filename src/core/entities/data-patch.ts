import stringify from 'fast-json-stable-stringify';
import type { InferOutput } from 'valibot';
import { object, partial } from 'valibot';
import { jsonDateReviver } from '../utils/date-utils.ts';
import { PostsManagerPatch } from './posts-manager.ts';
import { parseSchema } from './schema.ts';
import { createUploadFileName } from './upload.ts';
import { UsersManagerPatch } from './users-manager.ts';

export const DataPatch = partial(
  object({
    posts: PostsManagerPatch,
    extras: PostsManagerPatch,
    drafts: PostsManagerPatch,
    rejects: PostsManagerPatch,
    users: UsersManagerPatch,
  }),
);

export type DataPatch = InferOutput<typeof DataPatch>;

export function getDataPatchName(patch: DataPatch): string | undefined {
  const data = dataPatchToString(patch, true);
  if (data === '{}') {
    return;
  }

  return createUploadFileName([data, 'application/json', 'patch.json']);
}

export function dataPatchToString(patch: DataPatch, minify?: boolean): string {
  return minify ? stringify(patch) : JSON.stringify(patch, null, 2);
}

export function stringToDataPatch(str: string): DataPatch {
  return parseSchema(DataPatch, JSON.parse(str, jsonDateReviver));
}
