import type { Post, PostEntries, PostEntry } from '../../core/entities/post.js';
import { comparePostEntriesById, getPostEntriesFromSource } from '../../core/entities/post.js';
import type { PublishablePost } from '../../core/entities/post-variation.js';
import type { PostingServiceManager } from '../../core/entities/service.js';
import { getDaysPassed, getHoursPassed } from '../../core/utils/date-utils.js';
import { published } from '../data-managers/posts.js';
import { postingServiceManagers } from '../posting-service-managers/index.js';

export async function publishPosts() {
  console.group(`Publishing posts...`);

  const publishedPostEntries = await getPostEntriesFromSource(published.readAllEntries, comparePostEntriesById('desc'));

  try {
    for (const service of postingServiceManagers) {
      const entry = await findFirstUnpublishedServicePostEntry(publishedPostEntries, service);
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

export async function publishPostToService(service: PostingServiceManager, [id, post]: PostEntry<Post>) {
  if (!service.canPublishPost(post)) {
    console.info(`Cannot publish post ${id} to ${service.name}.`);
    return;
  }

  try {
    console.info(`Publishing post "${id}" to ${service.name}...`);
    await service.connect();
    await service.publishPost(post);
    await published.updateItem(id);
    await service.disconnect();
    console.info(`Published post "${id}" to ${service.name}.`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error publishing post "${id}" to ${service.name}: ${error.message}`);
    }
  }
}

async function findFirstUnpublishedServicePostEntry(
  publishedPostEntries: PostEntries<PublishablePost>,
  service: PostingServiceManager,
) {
  const publishablePostEntries = publishedPostEntries.filter(([, post]) => service.canPublishPost(post));
  let result: PostEntry<PublishablePost> | undefined;

  for (const entry of publishablePostEntries) {
    // Treat service post as already published for 30 days
    // TODO: fix for publishing gap more than 30 days
    const lastPublishedPost = entry[1].posts?.find(
      (post) => post.service === service.id && getDaysPassed(post.published) <= 30,
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
