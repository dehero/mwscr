import { posix } from 'path/posix';
import decompress from 'decompress';
import mime from 'mime';
import type { PostContent, PostEntry, PostViolation } from '../../core/entities/post.js';
import { mergePostContents, parsePostId } from '../../core/entities/post.js';
import { postTitleFromString } from '../../core/entities/post-title.js';
import type { Draft, DraftProposal, PublishablePost, Reject } from '../../core/entities/posts-manager.js';
import { createDraftId } from '../../core/entities/posts-manager.js';
import type { Resource, ResourceType } from '../../core/entities/resource.js';
import { ImageResourceUrl, parseResourceUrl, RESOURCE_MISSING_IMAGE } from '../../core/entities/resource.js';
import { checkRules } from '../../core/entities/rule.js';
import { assertSchema } from '../../core/entities/schema.js';
import {
  createStoreItemUrl,
  getTargetStoreDirFromPostType,
  parseStoreItemUrl,
  STORE_AVATARS_DIR,
  STORE_DRAWINGS_DIR,
  STORE_INBOX_DIR,
  STORE_SNAPSHOTS_DIR,
  STORE_TRASH_DIR,
} from '../../core/entities/store.js';
import { USER_UNKNOWN } from '../../core/entities/user.js';
import { importingScenarios } from '../../core/scenarios/importing.js';
import { asArray, getRevisionHash } from '../../core/utils/common-utils.js';
import { extractDateFromString } from '../../core/utils/date-utils.js';
import { storeManager } from '../store-managers/index.js';
import {
  extractResourceMediaMetadata,
  getResourceOriginalUrl,
  moveResource,
  readResource,
  resourceExists,
  writeResource,
} from './resources.js';

export async function importResourceToStore(
  resource: string | Resource,
  template?: Partial<DraftProposal>,
  imported?: Map<string, PostEntry<DraftProposal>[]>,
): Promise<PostEntry<DraftProposal>[]> {
  let violation: PostViolation | undefined;
  let data, mimeType, filename;

  if (typeof resource === 'string') {
    if (imported?.has(resource)) {
      return imported.get(resource) ?? [];
    }

    try {
      [data, mimeType, filename] = await readResource(resource);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error reading resource "${resource}": ${error.message}`);
      }
      ({ base: filename } = posix.parse(resource));
      mimeType = null;
      violation = 'unreachable-resource';
    }
  } else {
    [data, mimeType, filename] = resource;
  }

  const author = template?.author || USER_UNKNOWN;
  const type = template?.type || 'shot';

  const { name, ext: filenameExt } = posix.parse(filename);
  const mimeExt = mimeType ? mime.getExtension(mimeType) : undefined;
  const [nameDate, nameTitle] = extractDateFromString(name);
  const [date, text] = extractDateFromString(template?.title ?? '');
  const title = postTitleFromString(text || nameTitle);
  const ext = filenameExt || mimeExt ? `.${mimeExt}` : '';

  const hash = getRevisionHash(data ?? filename);

  const id = createDraftId(author, nameDate || date || template?.created || new Date(), title, hash);
  let content: PostContent = typeof resource === 'string' ? resource : filename;

  const errors: Set<string> = new Set();
  let resourceType: ResourceType | undefined;

  if (data) {
    for (const importingScenario of importingScenarios) {
      const [scenarioResourceType, resourceRules, mediaRules] = importingScenario;
      const resource: Resource = [data, mimeType, filename];
      const scenarioErrors: string[] = [];

      if (checkRules(resourceRules, resource, scenarioErrors)) {
        const metadata = await extractResourceMediaMetadata(resource);

        if (checkRules(mediaRules, metadata, scenarioErrors)) {
          errors.clear();
          resourceType = scenarioResourceType;
          break;
        }
      }

      errors.add(scenarioErrors.join(', '));
    }

    if (!resourceType) {
      violation = 'unsupported-resource';
      console.error(`Skipped importing resource "${content}" to store: ${[...errors].join(' OR ')}`);
    } else if (resourceType === 'archive') {
      let files;
      try {
        files = await decompress(data);
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Error decompressing resource "${content}": ${error.message}`);
        }
        violation = 'unsupported-resource';
      }

      if (files) {
        const result: PostEntry<DraftProposal>[] = [];

        for (const file of files) {
          if (file.type !== 'file') {
            continue;
          }

          const mimeType = mime.getType(file.path);

          const drafts = await importResourceToStore([file.data, mimeType, file.path], template, imported);
          result.push(...drafts);
        }

        return result;
      }
    } else {
      content = `store:/${STORE_INBOX_DIR}/${id}${ext}`;
      violation = undefined;

      // TODO: refactor this as separate function
      if (typeof resource === 'string') {
        const originalUrl = await getResourceOriginalUrl(resource);

        if (originalUrl && originalUrl !== resource) {
          const newOriginalUrl = await ensureOriginalResourceIsInStore(originalUrl, template, imported);
          if (newOriginalUrl) {
            const variantUrl = await findUnusedDraftVariantUrl(newOriginalUrl);
            if (variantUrl) {
              content = variantUrl;
            }
          }
        }
      }

      await writeResource(content, data);
    }
  }

  const draft: DraftProposal = {
    ...template,
    content,
    author,
    // TODO: detect possible post type from content
    type,
    title,
    violation,
  };

  const result: PostEntry<DraftProposal>[] = [[id, draft, 'drafts']];

  if (typeof resource === 'string') {
    imported?.set(resource, result);
  }

  return result;
}

export async function moveDraftResourcesToTrash(post: Draft) {
  const inboxDirUrl = `store:/${STORE_INBOX_DIR}`;
  const urls = [...asArray(post.content), ...asArray(post.trash)];

  post.content = await Promise.all(
    urls.map((url) => (url.startsWith(inboxDirUrl) ? moveResourceToStoreDir(url, STORE_TRASH_DIR) : url)),
  );
  post.trash = undefined;
}

export async function moveResourceToTrash(url: string) {
  const { base } = parseResourceUrl(url);

  const newUrl = `store:/${STORE_TRASH_DIR}/${base}`;
  await moveResource(url, newUrl);
}

export async function restoreRejectResources(post: Reject | Draft) {
  const trashDirUrl = `store:/${STORE_TRASH_DIR}`;
  const urls = [...asArray(post.content), ...asArray(post.trash)];

  post.content = await Promise.all(
    urls.map((url) => (url.startsWith(trashDirUrl) ? moveResourceToStoreDir(url, STORE_INBOX_DIR) : url)),
  );
  post.trash = undefined;
}

export async function moveResourceToStoreDir(url: string, dir: string) {
  const { base } = parseResourceUrl(url);

  const newUrl = `store:/${dir}/${base}`;
  await moveResource(url, newUrl);

  return newUrl;
}

export async function movePublishedPostResources([id, post]: PostEntry<PublishablePost>) {
  const { date, key } = parsePostId(id);
  if (!date) {
    throw new Error('Failed to get post date "${}"');
  }

  switch (post.type) {
    case 'achievement':
    case 'news':
    case 'photoshop':
    case 'outtakes':
    case 'shot':
    case 'wallpaper': {
      const targetDir = getTargetStoreDirFromPostType(post.type);
      if (!targetDir) {
        throw new Error(`Unable to detect target store directory for post type "${post.type}"`);
      }

      const content = asArray<string>(post.content);
      const newContent: ImageResourceUrl[] = [];

      for (let i = 0; i < content.length; i++) {
        const url = content[i]!;

        const source = parseStoreItemUrl(url);

        if (source?.dir === STORE_INBOX_DIR) {
          const keyWithIndex = `${key}${content.length > 1 ? `-${i}` : ''}`;

          const newUrl = createStoreItemUrl({
            dir: targetDir,
            date,
            key: keyWithIndex,
            ext: source.ext,
            variant: 'final',
          });
          const newOriginalUrl = createStoreItemUrl({
            dir: targetDir,
            date,
            key: keyWithIndex,
            ext: source.ext,
            variant: 'original',
          });

          assertSchema(ImageResourceUrl, newUrl, (message) => `Cannot create final store item url: ${message}`);

          if (url !== RESOURCE_MISSING_IMAGE) {
            await moveResource(url, newUrl);
          }

          const originalUrl = createStoreItemUrl({ ...source, variant: 'original' });

          if (originalUrl && originalUrl !== url && newOriginalUrl && (await resourceExists(originalUrl))) {
            // TODO: find usage for original preview (now not represented in docs)
            await moveResource(originalUrl, newOriginalUrl);
            post.trash = mergePostContents(asArray(post.trash).filter((url) => url !== originalUrl));
          }

          newContent.push(newUrl);
        } else {
          assertSchema(ImageResourceUrl, url, (message) => `Cannot use published url: ${message}`);

          newContent.push(url);
        }
      }

      if (newContent.length !== content.length) {
        throw new Error(`Unable to move all resources for post type "${post.type}"`);
      }

      post.content = mergePostContents(newContent) as typeof post.content;
      break;
    }
    case 'compilation': {
      for (const url of post.content) {
        if (url !== RESOURCE_MISSING_IMAGE && !(await resourceExists(url))) {
          throw new Error(`Need "${url}" to exist for post type "${post.type}"`);
        }
      }
      break;
    }
    case 'redrawing': {
      const oldDrawingUrl = post.content[0];
      const shotUrl = post.content[1];

      const { ext } = parseResourceUrl(oldDrawingUrl);
      const newDrawingUrl = `store:/${STORE_DRAWINGS_DIR}/${id}${ext}`;

      assertSchema(ImageResourceUrl, newDrawingUrl, (message) => `Cannot create published drawing url: ${message}`);

      if (shotUrl !== RESOURCE_MISSING_IMAGE && !(await resourceExists(shotUrl))) {
        throw new Error(`Need "${shotUrl}" to exist for post type "${post.type}"`);
      }
      if (oldDrawingUrl !== RESOURCE_MISSING_IMAGE) {
        await moveResource(oldDrawingUrl, newDrawingUrl);
      }
      post.content = [newDrawingUrl, shotUrl];
      break;
    }
    default:
      throw new Error(`Cannot move content for post type "${post.type}"`);
  }

  const snapshot = asArray(post.snapshot);
  const newSnapshot = [];
  for (let i = 0; i < snapshot.length; i++) {
    const url = snapshot[i]!;

    const source = parseStoreItemUrl(url);

    const keyWithIndex = `${key}${snapshot.length > 1 ? `-${i}` : ''}`;
    const newUrl = createStoreItemUrl({
      dir: STORE_SNAPSHOTS_DIR,
      date,
      key: keyWithIndex,
      ext: source?.ext ?? '',
      variant: 'final',
    });

    if (!newUrl) {
      continue;
    }

    // TODO: move original snapshots also (or make so that snapshots cannot have originals)
    if (url !== RESOURCE_MISSING_IMAGE) {
      await moveResource(url, newUrl);
    }

    newSnapshot.push(newUrl);
  }
  post.snapshot = mergePostContents(newSnapshot);

  const inboxDirUrl = `store:/${STORE_INBOX_DIR}`;
  const trashInboxUrls = asArray(post.trash).filter((url) => url.startsWith(inboxDirUrl));
  const trashUrls = await Promise.all(trashInboxUrls.map((url) => moveResourceToStoreDir(url, STORE_TRASH_DIR)));

  post.trash = mergePostContents(trashUrls);
}

export async function saveUserAvatar(
  resource: string | (() => Promise<Buffer | string | undefined>) | undefined,
  filename: ImageResourceUrl,
): Promise<ImageResourceUrl | undefined> {
  if (!resource) {
    return undefined;
  }

  const newUrl: ImageResourceUrl = `store:/${STORE_AVATARS_DIR}/${filename}`;

  if (!(await resourceExists(newUrl))) {
    if (typeof resource === 'string') {
      await moveResource(resource, newUrl);
    } else {
      const data = await resource();
      if (typeof data === 'string') {
        await moveResource(data, newUrl);
      } else if (data && data.byteLength > 0) {
        await writeResource(newUrl, data);
      } else {
        return undefined;
      }
    }
  }

  return newUrl;
}

export async function syncStoreResource(url: string) {
  const { path } = parseResourceUrl(url);

  try {
    for await (const [store, item] of storeManager.sync(path)) {
      console.info(`Synchronized "${item.url}" to ${store.name} store.`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error syncing resource "${url}": ${error.message}`);
    }
  }
}

export async function ensureOriginalResourceIsInStore(
  url: string,
  template?: Partial<DraftProposal>,
  imported?: Map<string, PostEntry<DraftProposal>[]>,
): Promise<string | undefined> {
  const { protocol } = parseResourceUrl(url);
  if (protocol === 'store:') {
    return url;
  }

  const drafts = await importResourceToStore(url, template, imported);
  if (drafts.length > 1) {
    return undefined;
  }

  const [, draft] = drafts[0] ?? [];
  const result = asArray(draft?.content)[0];

  return result;
}

export async function findUnusedDraftVariantUrl(url: string): Promise<string | undefined> {
  const source = parseStoreItemUrl(url);
  if (!source) {
    return undefined;
  }

  if (source.dir !== STORE_INBOX_DIR && source.dir !== STORE_TRASH_DIR) {
    return undefined;
  }

  let variant = 1;
  for (;;) {
    const variantUrl = createStoreItemUrl({ ...source, variant });
    if (variantUrl && !(await resourceExists(variantUrl))) {
      return variantUrl;
    }
    variant++;
  }
}
