import fs from 'fs/promises';
import { posix } from 'path';
import { asArray } from '../../core/utils/common-utils.js';
import { dataManager } from '../data-managers/manager.js';
import { createResourcePreview, RESOURCES_PREVIEWS_EXT, RESOURCES_PREVIEWS_PATH } from '../data-managers/resources.js';

export async function maintainPreviews() {
  console.group('Maintaining previews...');

  const deletablePreviewPaths = new Set(await getExistingPreviewPaths(RESOURCES_PREVIEWS_PATH));

  console.info(`Found ${deletablePreviewPaths.size} existing previews.`);

  console.info('Creating previews, searching for deletable previews...');

  for (const manager of dataManager.postsManagers) {
    for await (const [, post] of manager.readAllEntries(true)) {
      if (asArray(post.violation).includes('inappropriate-content')) {
        // Force delete previews of inappropriate content
        continue;
      }
      const urls = [...asArray(post.content), ...asArray(post.snapshot), ...asArray(post.trash)];
      for (const url of urls) {
        const previewPath = await createResourcePreview(url, 320, 320);
        if (previewPath) {
          deletablePreviewPaths.delete(previewPath);
        }
      }
    }
  }

  for await (const [, user] of dataManager.users.readAllEntries(true)) {
    const urls = [user.avatar, ...(user.profiles?.map((profile) => profile.avatar) ?? [])].filter(
      (url) => typeof url !== 'undefined',
    );

    for (const url of urls) {
      const previewPath = await createResourcePreview(url, 80, 80);
      if (previewPath) {
        deletablePreviewPaths.delete(previewPath);
      }
    }
  }

  console.info(`Found ${deletablePreviewPaths.size} deletable previews.`);

  for (const path of deletablePreviewPaths) {
    await fs.unlink(path);
    console.info(`Deleted preview "${path}".`);
  }

  console.groupEnd();
}

async function getExistingPreviewPaths(path: string) {
  const result: string[] = [];
  const items = await fs.readdir(path, { withFileTypes: true });
  for (const item of items) {
    if (item.isDirectory()) {
      result.push(...(await getExistingPreviewPaths(posix.join(path, item.name))));
    } else if (item.isFile() && item.name.endsWith(RESOURCES_PREVIEWS_EXT)) {
      result.push(posix.join(path, item.name));
    }
  }
  return result;
}
