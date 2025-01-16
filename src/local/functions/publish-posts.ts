import type { PostEntries, PostEntry } from '../../core/entities/post.js';
import {
  comparePostEntriesById,
  getPostEntriesFromSource,
  POST_RECENTLY_PUBLISHED_DAYS,
} from '../../core/entities/post.js';
import type { PublishablePost } from '../../core/entities/posts-manager.js';
import type { PostingServiceManager } from '../../core/entities/service.js';
import { getDaysPassed, getHoursPassed } from '../../core/utils/date-utils.js';
import { posts } from '../data-managers/posts.js';
import { postingServiceManagers } from '../posting-service-managers/index.js';

export async function publishPosts() {
  console.group(`Publishing posts...`);

  const publishedPostEntries = await getPostEntriesFromSource(posts.readAllEntries, comparePostEntriesById('desc'));

  try {
    for (const service of postingServiceManagers) {
      const entry = await findFirstUnpublishedPublicationEntry(publishedPostEntries, service);
      if (entry) {
        await publishPostToService(service, entry);
      } else {
        console.info(`No new posts found for ${service.name}.`);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error publishing posts: ${error.message}`);
    }
  }

  console.groupEnd();
}

export async function publishPostToService(service: PostingServiceManager, entry: PostEntry) {
  const [id, post] = entry;

  if (!service.canPublishPost(post)) {
    console.info(`Cannot publish post ${id} to ${service.name}.`);
    return;
  }

  try {
    console.info(`Publishing post "${id}" to ${service.name}...`);
    await service.connect();
    await service.publishPostEntry(entry);
    await posts.updateItem(id);
    await service.disconnect();
    console.info(`Published post "${id}" to ${service.name}.`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error publishing post "${id}" to ${service.name}: ${error.message}`);
    }
  }
}

async function findFirstUnpublishedPublicationEntry(
  publishedPostEntries: PostEntries<PublishablePost>,
  service: PostingServiceManager,
) {
  const publishablePostEntries = publishedPostEntries.filter(([, post]) => service.canPublishPost(post));
  let result: PostEntry<PublishablePost> | undefined;

  for (const entry of publishablePostEntries) {
    const lastPublishedPost = entry[1].posts?.find(
      (post) => post.service === service.id && getDaysPassed(post.published) <= POST_RECENTLY_PUBLISHED_DAYS,
    );
    if (lastPublishedPost) {
      // Do not publish too often
      if (getHoursPassed(lastPublishedPost.published) < 8) {
        return undefined;
      }
      break;
    }
    result = entry;
  }

  return result;
}
