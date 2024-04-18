import { getPostEntriesFromSource, type PostEntries } from '../../core/entities/post.js';
import type { PostingService } from '../../core/entities/service.js';
import type { ServicePost } from '../../core/entities/service-post.js';
import { isServicePostUpdatable } from '../../core/entities/service-post.js';
import { published } from '../data-managers/posts.js';
import { postingServices } from '../services/index.js';

export async function updatePosts() {
  console.group('Updating published posts reactions...');

  try {
    const postEntries = await getPostEntriesFromSource(() => published.getAllPosts(true));

    await Promise.all(postingServices.map((service) => updateServicePosts(service, postEntries)));
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error updating posts: ${error.message}`);
    }
  }

  console.groupEnd();
}

async function updateServicePosts(service: PostingService, postEntries: PostEntries) {
  const updatableServicePosts = postEntries
    .flatMap(
      ([id, post]): Array<[id: string, servicePost: ServicePost<unknown>]> =>
        post.posts
          ?.filter((servicePost) => servicePost.service === service.id && isServicePostUpdatable(servicePost))
          ?.map((servicePost) => [id, servicePost]) ?? [],
    )
    .sort((a, b) => b[1].published.getTime() - a[1].published.getTime());

  if (updatableServicePosts.length === 0) {
    console.info(`No ${service.name} posts to update.`);
    return;
  }

  console.info(`Found ${updatableServicePosts.length} ${service.name} posts to update.`);

  try {
    await service.connect();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error connecting ${service.name}: ${error.message}`);
    }
    return;
  }

  for (const [id, servicePost] of updatableServicePosts) {
    try {
      await service.updateServicePost(servicePost);
      await published.updatePost(id);
      console.info(`Updated ${service.name} reactions for post "${id}".`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error updating ${service.name} reactions for post "${id}": ${error.message}`);
      }
      console.info(`Will continue updating ${service.name} reactions on next run.`);
      break;
    }
  }

  await service.disconnect();
}
