import { posix } from 'path/posix';
import decompress from 'decompress';
import mime from 'mime';
import type { PostContent, PostEntry, PostViolation } from '../entities/post.js';
import { mergePostContents } from '../entities/post.js';
import { postTitleFromString } from '../entities/post-title.js';
import type { InboxItem, PostDraft, PublishablePost, TrashItem } from '../entities/post-variation.js';
import type { Resource, ResourceType } from '../entities/resource.js';
import { parseResourceUrl, RESOURCE_MISSING_IMAGE } from '../entities/resource.js';
import { checkRules } from '../entities/rule.js';
import {
  parseStoreResourceUrl,
  STORE_DRAWINGS_DIR,
  STORE_INBOX_DIR,
  STORE_SHOTS_DIR,
  STORE_TRASH_DIR,
} from '../entities/store.js';
import { USER_UNKNOWN } from '../entities/user.js';
import { importingScenarios } from '../scenarios/importing.js';
import { asArray } from '../utils/common-utils.js';
import { getDataHash } from '../utils/data-utils.js';
import { extractDateFromString } from '../utils/date-utils.js';
import { createInboxItemId } from './posts.js';
import {
  extractResourceMediaMetadata,
  moveResource,
  readResource,
  resourceExists,
  writeResource,
} from './resources.js';

export async function importResourceToStore(
  resource: string | Resource,
  template?: Partial<PostDraft>,
  templateDate?: Date,
): Promise<PostEntry<PostDraft>[]> {
  let violation: PostViolation | undefined;
  let data, mimeType, filename;

  if (typeof resource === 'string') {
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
  const { name, ext } = posix.parse(filename);
  const [date, key] = extractDateFromString(`${name} ${template?.title ?? ''}`);
  const hash = getDataHash(data ?? filename);

  const id = createInboxItemId(author, date || templateDate || new Date(), key, hash);
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
        const result: PostEntry<PostDraft>[] = [];

        for (const file of files) {
          if (file.type !== 'file') {
            continue;
          }

          const mimeType = mime.getType(file.path);

          const drafts = await importResourceToStore([file.data, mimeType, file.path], template, templateDate);
          result.push(...drafts);
        }

        return result;
      }
    } else {
      content = `store:/${STORE_INBOX_DIR}/${id}${ext}`;
      violation = undefined;
      await writeResource(content, data);
    }
  }

  const draft: PostDraft = {
    ...template,
    content,
    author,
    // TODO: detect possible post type from content
    type,
    title: postTitleFromString(key),
    violation,
  };

  return [[id, draft]];
}

export async function moveInboxItemResourcesToTrash(post: InboxItem) {
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

export async function restoreTrashItemResources(post: TrashItem | InboxItem) {
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
  switch (post.type) {
    case 'shot': {
      if (typeof post.content !== 'string') {
        throw new TypeError(
          `Need content to be of type "string" for post type "${post.type}", got "${typeof post.content}"`,
        );
      }

      const { ext, originalUrl } = parseStoreResourceUrl(post.content);
      const newUrl = `store:/${STORE_SHOTS_DIR}/${id}${ext}`;
      const { originalUrl: newOriginalUrl } = parseStoreResourceUrl(newUrl);

      if (post.content !== RESOURCE_MISSING_IMAGE) {
        await moveResource(post.content, newUrl);
      }

      if (originalUrl && newOriginalUrl) {
        // TODO: find usage for original preview (now not represented in docs)
        await moveResource(originalUrl, newOriginalUrl);
        post.trash = mergePostContents(asArray(post.trash).filter((url) => url !== originalUrl));
      }

      post.content = newUrl;
      break;
    }
    case 'shot-set': {
      if (!Array.isArray(post.content)) {
        throw new TypeError(
          `Need content to be of type "Array" for post type "${post.type}", got "${typeof post.content}"`,
        );
      }
      for (const url of post.content) {
        if (url !== RESOURCE_MISSING_IMAGE && !(await resourceExists(url))) {
          throw new Error(`Need "${url}" to exist for post type "${post.type}"`);
        }
      }
      break;
    }
    case 'drawing': {
      if (!Array.isArray(post.content)) {
        throw new TypeError(
          `Need content to be of type "Array" for post type "${post.type}", got "${typeof post.content}"`,
        );
      }

      const oldDrawingUrl = post.content[0];
      const shotUrl = post.content[1];

      if (!oldDrawingUrl) {
        throw new TypeError(`No drawing url in content for post type "${post.type}"`);
      }

      if (!shotUrl) {
        throw new TypeError(`No shot url in content for post type "${post.type}"`);
      }

      const { ext } = parseResourceUrl(oldDrawingUrl);
      const newDrawingUrl = `store:/${STORE_DRAWINGS_DIR}/${id}${ext}`;

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

  const inboxDirUrl = `store:/${STORE_INBOX_DIR}`;
  const trashInboxUrls = asArray(post.trash).filter((url) => url.startsWith(inboxDirUrl));
  const trashUrls = await Promise.all(trashInboxUrls.map((url) => moveResourceToStoreDir(url, STORE_TRASH_DIR)));

  post.trash = mergePostContents(trashUrls);
}
