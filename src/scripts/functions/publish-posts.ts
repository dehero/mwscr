import type { PostEntry } from '../../core/entities/post.js';
import { comparePostEntriesByDate, getPostDateById } from '../../core/entities/post.js';
import { PublicPostsManagerName } from '../../core/entities/posts-manager.js';
import { PUBLICATION_MINIMUM_GAP_HOURS } from '../../core/entities/publication.js';
import type { PostingServiceManager } from '../../core/entities/service.js';
import { getHoursPassed } from '../../core/utils/date-utils.js';
import { dataManager } from '../data-managers/manager.js';
import { postingServiceManagers } from '../posting-service-managers/index.js';

export async function publishPosts() {
  console.group(`Publishing posts...`);

  const comparator = comparePostEntriesByDate('desc');

  for (const managerName of PublicPostsManagerName.options) {
    const postsManager = dataManager.findPostsManager(managerName);
    if (!postsManager) {
      throw new Error(`Cannot find posts manager "${managerName}".`);
    }

    const publicPostEntries = (await postsManager.getAllEntries()).sort(comparator);

    try {
      for (const service of postingServiceManagers) {
        const entry = await findFirstUnpublishedPostEntry(publicPostEntries, service);
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
  }

  console.groupEnd();
}

export async function publishPostToService(service: PostingServiceManager, entry: PostEntry) {
  const [id, post, managerName] = entry;
  const postsManager = dataManager.findPostsManager(managerName);

  if (!postsManager) {
    throw new Error(`Cannot find posts manager "${managerName}".`);
  }

  if (!service.canPublishPost(post)) {
    console.info(`Cannot publish post ${id} to ${service.name}.`);
    return;
  }

  try {
    console.info(`Publishing post "${id}" to ${service.name}...`);
    await service.connect();
    await service.publishPostEntry(entry);
    await postsManager.save();
    console.info(`Published post "${id}" to ${service.name}.`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error publishing post "${id}" to ${service.name}: ${error.message}`);
    }
  } finally {
    await service.disconnect();
  }
}

async function findFirstUnpublishedPostEntry(postEntries: PostEntry[], service: PostingServiceManager) {
  const publishableEntries = postEntries.filter((entry) => service.canPublishPost(entry[1]));
  let result: PostEntry | undefined;

  for (const entry of publishableEntries) {
    const postDate = getPostDateById(entry[0]);
    if (!postDate) {
      return undefined;
    }
    const lastPublication = entry[1].posts?.find(
      (publication) => publication.service === service.id && publication.published.getTime() >= postDate.getTime(),
    );
    if (lastPublication) {
      // Do not publish too often
      if (getHoursPassed(lastPublication.published) < PUBLICATION_MINIMUM_GAP_HOURS) {
        return undefined;
      }
      // Find last publication and take next entry after it
      break;
    }
    result = entry;
  }

  return result;
}
