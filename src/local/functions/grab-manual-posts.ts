import type { Post, PostEntry } from '../../core/entities/post.js';
import { getPostEntriesFromSource, isPostEqual, mergePostWith } from '../../core/entities/post.js';
import type { PublishablePost } from '../../core/entities/post-variation.js';
import { isPublishablePost } from '../../core/entities/post-variation.js';
import type { PostingServiceManager } from '../../core/entities/service.js';
import type { ServicePost } from '../../core/entities/service-post.js';
import { arrayFromAsync } from '../../core/utils/common-utils.js';
import { createPublishedPostId, published } from '../data-managers/posts.js';
import { postingServiceManagers } from '../posting-service-managers/index.js';

export async function grabManualPosts() {
  console.group('Grabbing manually created posts...');

  for (const service of postingServiceManagers) {
    try {
      await service.connect();
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error connecting ${service.name}: ${error.message}`);
      }
      continue;
    }

    try {
      await grabManualServicePosts(service);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Error grabbing posts from ${service.name}: ${error.message}`);
      }
    } finally {
      await service.disconnect();
    }
  }

  console.groupEnd();
}

async function grabManualServicePosts(service: PostingServiceManager) {
  const allServicePosts = await arrayFromAsync(getAllServicePosts(service.id));
  const lastServicePost = allServicePosts.sort((a, b) => b.published.getTime() - a.published.getTime())[0];
  const newPosts = await service.grabPosts(lastServicePost);

  if (newPosts.length === 0) {
    console.info(`No new manual posts found on ${service.name}.`);
    return;
  }

  console.info(`Found ${newPosts.length} new manual posts on ${service.name}. Importing...`);

  for (const newPost of newPosts) {
    const [id, post] = (await findLastPublishedPostEntry((post) => isPostEqual(post, newPost))) || [];
    if (!post || !id) {
      try {
        if (!newPost.mark) {
          newPost.mark = 'C';
        }

        const errors: string[] = [];
        if (!isPublishablePost(newPost, errors)) {
          throw new Error(errors.join(', ') || 'cannot add published post');
        }

        const newId = createPublishedPostId(newPost);
        await published.addItem(newPost, newId);

        console.info(`Imported manual ${service.name} post "${newId}".`);
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Error importing manual ${service.name} post ${JSON.stringify(newPost)}: ${error.message}`);
        }
      }
    } else {
      mergePostWith(post, newPost);
      await published.updateItem(id);
      console.info(`Merged manual ${service.name} post with existing post "${id}".`);
    }
  }
}

async function findLastPublishedPostEntry(
  filter: (post: Post) => boolean,
): Promise<PostEntry<PublishablePost> | undefined> {
  const years = (await published.getChunkNames()).reverse();

  for (const year of years) {
    const postEntries = await getPostEntriesFromSource(() => published.readChunkEntries(year));
    const postEntry = [...postEntries].reverse().find(([_, post]) => filter(post));
    if (postEntry) {
      return postEntry;
    }
  }

  return undefined;
}

async function* getAllServicePosts(service: string): AsyncGenerator<ServicePost<unknown>> {
  for await (const [, post] of published.readAllEntries()) {
    if (!post.posts) {
      continue;
    }
    for (const servicePost of post.posts) {
      if (servicePost.service === service) {
        yield servicePost;
      }
    }
  }
}
