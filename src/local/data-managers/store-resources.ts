import { posix } from 'path/posix';
import decompress from 'decompress';
import mime from 'mime';
import type { PostContent, PostEntry, PostViolation } from '../../core/entities/post.js';
import { mergePostContents } from '../../core/entities/post.js';
import { postTitleFromString } from '../../core/entities/post-title.js';
import type { DraftProposal, InboxItem, PublishablePost, TrashItem } from '../../core/entities/posts-manager.js';
import { createInboxItemId } from '../../core/entities/posts-manager.js';
import type { Resource, ResourceType } from '../../core/entities/resource.js';
import { ImageResourceUrl, parseResourceUrl, RESOURCE_MISSING_IMAGE } from '../../core/entities/resource.js';
import { checkRules } from '../../core/entities/rule.js';
import { assertSchema } from '../../core/entities/schema.js';
import {
  getTargetStoreDirFromPostType,
  parseStoreResourceUrl,
  STORE_DRAWINGS_DIR,
  STORE_INBOX_DIR,
  STORE_TRASH_DIR,
} from '../../core/entities/store.js';
import { USER_UNKNOWN } from '../../core/entities/user.js';
import { importingScenarios } from '../../core/scenarios/importing.js';
import { asArray, getRevisionHash } from '../../core/utils/common-utils.js';
import { extractDateFromString } from '../../core/utils/date-utils.js';
import {
  extractResourceMediaMetadata,
  moveResource,
  readResource,
  resourceExists,
  writeResource,
} from './resources.js';

export async function importResourceToStore(
  resource: string | Resource,
  template?: Partial<DraftProposal>,
  templateDate?: Date,
): Promise<PostEntry<DraftProposal>[]> {
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

  const { name, ext: filenameExt } = posix.parse(filename);
  const mimeExt = mimeType ? mime.getExtension(mimeType) : undefined;
  const [nameDate, nameTitle] = extractDateFromString(name);
  const [date, text] = extractDateFromString(template?.title ?? '');
  const title = postTitleFromString(text || nameTitle);
  const ext = filenameExt || mimeExt ? `.${mimeExt}` : '';

  // @ts-expect-error TODO: resolve typing issues
  const hash = getRevisionHash(data ?? filename);

  const id = createInboxItemId(author, nameDate || date || templateDate || new Date(), title, hash);
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

  const draft: DraftProposal = {
    ...template,
    content,
    author,
    // TODO: detect possible post type from content
    type,
    title,
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
    case 'shot':
    case 'wallpaper':
    case 'wallpaper-v': {
      const dir = getTargetStoreDirFromPostType(post.type);
      if (!dir) {
        throw new Error(`Unable to detect target store directory for post type "${post.type}"`);
      }

      const { ext, originalUrl } = parseStoreResourceUrl(post.content);
      const newUrl = `store:/${dir}/${id}${ext}`;
      const { originalUrl: newOriginalUrl } = parseStoreResourceUrl(newUrl);

      assertSchema(ImageResourceUrl, newUrl, (message) => `Cannot create published shot url: ${message}`);

      if (post.content !== RESOURCE_MISSING_IMAGE) {
        await moveResource(post.content, newUrl);
      }

      if (originalUrl && newOriginalUrl && (await resourceExists(originalUrl))) {
        // TODO: find usage for original preview (now not represented in docs)
        await moveResource(originalUrl, newOriginalUrl);
        post.trash = mergePostContents(asArray(post.trash).filter((url) => url !== originalUrl));
      }

      post.content = newUrl;
      break;
    }
    case 'shot-set': {
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

  const inboxDirUrl = `store:/${STORE_INBOX_DIR}`;
  const trashInboxUrls = asArray(post.trash).filter((url) => url.startsWith(inboxDirUrl));
  const trashUrls = await Promise.all(trashInboxUrls.map((url) => moveResourceToStoreDir(url, STORE_TRASH_DIR)));

  post.trash = mergePostContents(trashUrls);
}
