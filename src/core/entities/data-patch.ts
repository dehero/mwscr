import type { InferOutput } from 'valibot';
import { object, partial } from 'valibot';
import { getRevisionHash } from '../utils/common-utils.js';
import { jsonDateReviver } from '../utils/date-utils.js';
import { PostsManagerPatch } from './posts-manager.js';
import { parseSchema } from './schema.js';
import { UsersManagerPatch } from './users-manager.js';

export const DataPatch = partial(
  object({
    posts: PostsManagerPatch,
    extras: PostsManagerPatch,
    inbox: PostsManagerPatch,
    trash: PostsManagerPatch,
    users: UsersManagerPatch,
  }),
);

export type DataPatch = InferOutput<typeof DataPatch>;

export function getDataPatchName(patch: DataPatch | undefined): string {
  if (!patch) {
    return 'data-patch';
  }

  const hash = getRevisionHash(JSON.stringify(patch));

  return `data-patch-${hash}`;
}

export function getDataPatchFilename(patch: DataPatch): string {
  return `mwscr.${getDataPatchName(patch)}.json`;
}

export function dataPatchToString(patch: DataPatch, minify?: boolean): string {
  return JSON.stringify(patch, null, minify ? undefined : 2);
}

export function stringToDataPatch(str: string): DataPatch {
  return parseSchema(DataPatch, JSON.parse(str, jsonDateReviver));
}
