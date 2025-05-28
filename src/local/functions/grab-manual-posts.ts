import type { Post, PostEntry } from '../../core/entities/post.js';
import { isPostEqual, mergePostWith } from '../../core/entities/post.js';
import type { PublishablePost } from '../../core/entities/posts-manager.js';
import { isPublishablePost } from '../../core/entities/posts-manager.js';
import type { Publication } from '../../core/entities/publication.js';
import type { PostingServiceManager } from '../../core/entities/service.js';
import { arrayFromAsync } from '../../core/utils/common-utils.js';
import { posts } from '../data-managers/posts.js';
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
      await grabManualPublications(service);
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

async function grabManualPublications(service: PostingServiceManager) {
  const allPublications = await arrayFromAsync(getAllPublications(service.id));
  const lastPublication = allPublications.sort((a, b) => b.published.getTime() - a.published.getTime())[0];
  const newPosts = await service.grabPosts(lastPublication);

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
          throw new Error(errors.join(', ') || 'cannot add post');
        }

        const newId = await posts.createItemId(newPost);
        await posts.addItem(newPost, newId);
        await posts.save();

        console.info(`Imported manual ${service.name} post "${newId}".`);
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Error importing manual ${service.name} post ${JSON.stringify(newPost)}: ${error.message}`);
        }
      }
    } else {
      mergePostWith(post, newPost);
      await posts.save();
      console.info(`Merged manual ${service.name} post with existing post "${id}".`);
    }
  }
}

async function findLastPublishedPostEntry(
  filter: (post: Post) => boolean,
): Promise<PostEntry<PublishablePost> | undefined> {
  const years = [...(await posts.getAllChunkNames())].reverse();

  for (const year of years) {
    const postEntries = await posts.getChunkEntries(year);
    const postEntry = [...postEntries].reverse().find(([_, post]) => filter(post));
    if (postEntry) {
      return postEntry;
    }
  }

  return undefined;
}

async function* getAllPublications(service: string): AsyncGenerator<Publication> {
  for await (const [, post] of posts.readAllEntries()) {
    if (!post.posts) {
      continue;
    }
    for (const publication of post.posts) {
      if (publication.service === service) {
        yield publication;
      }
    }
  }
}
