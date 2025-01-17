import type { InferOutput } from 'valibot';
import { intersect, object, optional, record } from 'valibot';
import { getRevisionHash } from '../utils/common-utils.js';
import { ListManagerPatch } from './list-manager.js';
import { PostPatch } from './post.js';
import { PostsManagerName } from './posts-manager.js';
import { parseSchema } from './schema.js';
import { UserPatch } from './user.js';

export const DataPatch = intersect([
  record(PostsManagerName, ListManagerPatch(PostPatch)),
  object({ users: optional(ListManagerPatch(UserPatch)) }),
]);

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
  return parseSchema(DataPatch, JSON.parse(str));
}
