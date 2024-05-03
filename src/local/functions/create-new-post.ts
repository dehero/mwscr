import type { PostEntries, PostEntry } from '../../core/entities/post.js';
import { comparePostEntriesById, getPostEntriesFromSource } from '../../core/entities/post.js';
import type { PublishablePost } from '../../core/entities/post-variation.js';
import { isPublishablePost } from '../../core/entities/post-variation.js';
import { checkRules } from '../../core/entities/rule.js';
import type { PostingScenario } from '../../core/scenarios/posting.js';
import { postingScenarios } from '../../core/scenarios/posting.js';
import { createPublishedPostId, createRepostId, inbox, published } from '../data-managers/posts.js';
import { movePublishedPostResources } from '../data-managers/store-resources.js';
import type { LocalPostsManager } from '../data-managers/utils/local-posts-manager.js';

const DEBUG_POSTING = Boolean(process.env.DEBUG_POSTING) || false;

export async function createNewPost() {
  console.group(`Creating new post...`);

  try {
    const publishedPostEntries = await getPostEntriesFromSource(published.getAllPosts, comparePostEntriesById('desc'));

    const postsManagers = [inbox, published];

    for (const postingScenario of postingScenarios) {
      const entry = await selectPostFromScenario(postingScenario, postsManagers, publishedPostEntries);
      if (!entry) {
        continue;
      }

      const [id, post] = entry;

      if (!post.posts) {
        const newId = createPublishedPostId(post);

        await movePublishedPostResources([newId, post]);
        await published.addPost(newId, post);
        await inbox.removePost(id);

        console.info(`Created post "${newId}" from inbox item "${id}".`);
      } else {
        const newId = createRepostId(post);

        await published.addPost(newId, id);

        console.info(`Reposted "${id}" as "${newId}".`);
      }

      break;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error creating new post: ${error.message}`);
    }
  }

  console.groupEnd();
}

export async function selectPostFromScenario(
  postingScenario: PostingScenario,
  postManagers: LocalPostsManager[],
  publishedPostEntries: PostEntries,
): Promise<PostEntry<PublishablePost> | undefined> {
  const [title, postingRules, postCandidateRules] = postingScenario;
  const errors: string[] = [];

  if (!checkRules(postingRules, undefined, errors, publishedPostEntries) && !DEBUG_POSTING) {
    console.info(`Skipped scenario "${title}": ${errors.join(', ')}.`);
    return;
  }

  for (const postManager of postManagers) {
    console.info(`Running scenario "${title}" on ${postManager.name} posts...`);

    const postEntries = await getPostEntriesFromSource(postManager.getAllPosts, undefined, isPublishablePost);
    const candidates: PostEntry<PublishablePost>[] = [];

    for (const [id, post] of postEntries) {
      const errors: string[] = [];

      if (checkRules(postCandidateRules, post, errors, publishedPostEntries)) {
        candidates.push([id, post]);
      } else {
        console.info(`Skipped post "${id}": ${errors.join(', ')}`);
      }
    }

    if (candidates.length === 0) {
      console.info(`No post candidates found.`);
      continue;
    }

    if (candidates.length === 1) {
      console.info(`Found ${candidates.length} post candidate, selecting it...`);
      return candidates[0];
    }

    console.info(`Found ${candidates.length} post candidates, selecting random one...`);

    return candidates[Math.floor(Math.random() * candidates.length)] ?? undefined;
  }

  return undefined;
}
