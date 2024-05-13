import type { Post, PostEntries, PostEntry } from '../../core/entities/post.js';
import { comparePostEntriesById, getPostEntriesFromSource } from '../../core/entities/post.js';
import type { PublishablePost } from '../../core/entities/post-variation.js';
import type { PostingService } from '../../core/entities/service.js';
import { getDaysPassed } from '../../core/utils/date-utils.js';
import { published } from '../data-managers/posts.js';
import { postingServices } from '../posting-service-managers/index.js';

export async function publishPosts() {
  console.group(`Publishing posts...`);

  const publishedPostEntries = await getPostEntriesFromSource(published.getAllPosts, comparePostEntriesById('desc'));

  try {
    for (const service of postingServices) {
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

export async function publishPostToService(service: PostingService, [id, post]: PostEntry<Post>) {
  if (!service.canPublishPost(post)) {
    console.info(`Cannot publish post ${id} to ${service.name}.`);
    return;
  }

  try {
    console.info(`Publishing post "${id}" to ${service.name}...`);
    await service.connect();
    await service.publishPost(post);
    await published.updatePost(id);
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
  service: PostingService,
) {
  const publishablePostEntries = publishedPostEntries.filter(([, post]) => service.canPublishPost(post));
  let result: PostEntry<PublishablePost> | undefined;

  for (const entry of publishablePostEntries) {
    // Treat service post as already published for 7 days
    if (entry[1].posts?.some((post) => post.service === service.id && getDaysPassed(post.published) <= 7)) {
      break;
    }
    result = entry;
  }

  return result;
}
