import type { PostEntries } from '../../core/entities/post.js';
import type { Publication } from '../../core/entities/publication.js';
import { isPublicationUpdatable } from '../../core/entities/publication.js';
import type { PostingServiceManager } from '../../core/entities/service.js';
import { posts } from '../data-managers/posts.js';
import { postingServiceManagers } from '../posting-service-managers/index.js';

export async function updatePosts() {
  console.group('Updating published posts reactions...');

  try {
    const postEntries = await posts.getAllEntries(true);

    await Promise.all(postingServiceManagers.map((service) => updatePublications(service, postEntries)));
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error updating posts: ${error.message}`);
    }
  }

  console.groupEnd();
}

async function updatePublications(service: PostingServiceManager, postEntries: PostEntries) {
  let failCount = 0;

  const updatablePublications = postEntries
    .flatMap(
      ([id, post]): Array<[id: string, publication: Publication]> =>
        post.posts
          ?.filter((publication) => publication.service === service.id && isPublicationUpdatable(publication))
          ?.map((publication) => [id, publication]) ?? [],
    )
    .sort((a, b) => b[1].published.getTime() - a[1].published.getTime());

  if (updatablePublications.length === 0) {
    console.info(`No ${service.name} posts to update.`);
    return;
  }

  console.info(`Found ${updatablePublications.length} ${service.name} posts to update.`);

  try {
    await service.connect();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error connecting ${service.name}: ${error.message}`);
    }
    return;
  }

  for (const [id, publication] of updatablePublications) {
    try {
      await service.updatePublication(publication);
      await posts.updateItem(id);
      console.info(`Updated ${service.name} reactions for post "${id}".`);
      failCount = 0;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error updating ${service.name} reactions for post "${id}": ${error.message}`);
      }
      failCount++;
      if (failCount >= 5) {
        console.info(
          `Successively failed ${failCount} ${service.name} reactions update attempts. Will continue updating on next run.`,
        );
        break;
      }
    }
  }

  await service.disconnect();
}
