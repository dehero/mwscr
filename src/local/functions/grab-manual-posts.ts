import { isPostEqual, mergePostWith } from '../../core/entities/post.js';
import { isPublishablePost } from '../../core/entities/post-variation.js';
import type { PostingServiceManager } from '../../core/entities/service.js';
import { arrayFromAsync } from '../../core/utils/common-utils.js';
import {
  createPublishedPostId,
  findLastPublishedPostEntry,
  getAllServicePosts,
  published,
} from '../data-managers/posts.js';
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
        await published.addPost(newId, newPost);

        console.info(`Imported manual ${service.name} post "${newId}".`);
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Error importing manual ${service.name} post ${JSON.stringify(newPost)}: ${error.message}`);
        }
      }
    } else {
      mergePostWith(post, newPost);
      await published.updatePost(id);
      console.info(`Merged manual ${service.name} post with existing post "${id}".`);
    }
  }
}
