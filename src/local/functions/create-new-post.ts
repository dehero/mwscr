import type { PostEntries, PostEntry } from '../../core/entities/post.js';
import { comparePostEntriesById, getPostEntriesFromSource } from '../../core/entities/post.js';
import type { PostsManager, PublishablePost } from '../../core/entities/posts-manager.js';
import { createNewPostId, createRepostId, isPublishablePost } from '../../core/entities/posts-manager.js';
import { checkRules } from '../../core/entities/rule.js';
import type { PostingScenario } from '../../core/scenarios/posting.js';
import { postingScenarios } from '../../core/scenarios/posting.js';
import { inbox, posts } from '../data-managers/posts.js';
import { movePublishedPostResources } from '../data-managers/store-resources.js';

const DEBUG_POSTING = Boolean(process.env.DEBUG_POSTING) || false;

export async function createNewPost() {
  console.group(`Creating new post...`);

  try {
    const publishedPostEntries = await getPostEntriesFromSource(posts.readAllEntries, comparePostEntriesById('desc'));

    const postsManagers = [inbox, posts];

    for (const postingScenario of postingScenarios) {
      const entry = await selectPostFromScenario(postingScenario, postsManagers, publishedPostEntries);
      if (!entry) {
        continue;
      }

      const [id, post] = entry;

      if (!post.posts) {
        const newId = createNewPostId(post);

        await movePublishedPostResources([newId, post]);

        await posts.addItem(post, newId);
        await inbox.removeItem(id);

        await posts.save();
        await inbox.save();

        console.info(`Created post "${newId}" from inbox item "${id}".`);
      } else {
        const newId = createRepostId(post);

        posts.addItem(id, newId);
        await posts.save();

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
  postManagers: PostsManager[],
  publishedPostEntries: PostEntries,
): Promise<PostEntry<PublishablePost> | undefined> {
  const [title, postingRules, postCandidateRules] = postingScenario;
  const errors: string[] = [];

  if (!checkRules(postingRules, undefined, errors, publishedPostEntries) && !DEBUG_POSTING) {
    console.info(`Skipped scenario "${title}": ${errors.join(', ')}.`);
    return;
  }

  for (const postManager of postManagers) {
    console.info(`Running scenario "${title}" on ${postManager.name} items...`);

    const postEntries = await getPostEntriesFromSource(
      () => postManager.readAllEntries(true),
      undefined,
      isPublishablePost,
    );
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
