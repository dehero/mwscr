import type { PostEntry } from '../../core/entities/post.js';
import { comparePostEntriesByDate, getPostEntriesFromSource } from '../../core/entities/post.js';
import type { PostsManager, PublishablePost } from '../../core/entities/posts-manager.js';
import { isPublishablePost, PublicPostsManagerName } from '../../core/entities/posts-manager.js';
import { checkRules } from '../../core/entities/rule.js';
import type { PostingRuleContext } from '../../core/rules/posting-rules.js';
import type { PostingScenario } from '../../core/scenarios/posting.js';
import { postingScenarios } from '../../core/scenarios/posting.js';
import { dataManager } from '../data-managers/manager.js';
import { movePublishedPostResources } from '../data-managers/store-resources.js';

const DEBUG_POSTING = Boolean(process.env.DEBUG_POSTING) || false;

interface ScenarioResult {
  sourceManager: PostsManager;
  entry: PostEntry<PublishablePost>;
}

export async function createNewPost() {
  console.group(`Creating new post...`);

  try {
    const comparator = comparePostEntriesByDate('desc');
    const publicPostEntries = Object.fromEntries(
      await Promise.all(
        PublicPostsManagerName.options.map((managerName) =>
          (async () => [
            managerName,
            (await dataManager.findPostsManager(managerName)!.getAllEntries()).sort(comparator),
          ])(),
        ),
      ),
    );

    for (const postingScenario of postingScenarios) {
      const targetManager = dataManager.findPostsManager(postingScenario.targetManager);
      if (!targetManager) {
        throw new Error(`Target manager "${postingScenario.targetManager}" not found.`);
      }

      const context: PostingRuleContext = { targetManager: postingScenario.targetManager, publicPostEntries };

      const scenarioResult = await selectPostByScenario(postingScenario, context);
      if (!scenarioResult) {
        continue;
      }

      const { sourceManager, entry } = scenarioResult;
      const [id, post] = entry;

      if (sourceManager !== targetManager) {
        const newId = await targetManager.createItemId(post);

        await movePublishedPostResources([newId, post, targetManager.name]);

        await targetManager.addItem(post, newId);
        await sourceManager.removeItem(id);

        await targetManager.save();
        await sourceManager.save();

        console.info(`Created post "${newId}" from ${sourceManager.name} item "${id}".`);
      } else {
        const newId = await targetManager.createItemId({ ...post, posts: undefined });

        targetManager.addItem(id, newId);
        await targetManager.save();

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

export async function selectPostByScenario(
  postingScenario: PostingScenario,
  context: PostingRuleContext,
): Promise<ScenarioResult | undefined> {
  const errors: string[] = [];

  if (!checkRules(postingScenario.postingRules, undefined, errors, context) && !DEBUG_POSTING) {
    console.info(`Skipped scenario "${postingScenario.title}": ${errors.join(', ')}.`);
    return;
  }

  for (const sourceManagerName of postingScenario.sourceManagers) {
    const sourceManager = dataManager.findPostsManager(sourceManagerName);
    if (!sourceManager) {
      throw new Error(`Cannot find posts source manager "${sourceManagerName}".`);
    }

    console.info(`Running scenario "${postingScenario.title}" on ${sourceManager.name} items...`);

    const sourcePostEntries = await getPostEntriesFromSource(
      () => sourceManager.readAllEntries(true),
      undefined,
      isPublishablePost,
    );
    const candidates: PostEntry<PublishablePost>[] = [];

    for (const [id, post, managerName] of sourcePostEntries) {
      const errors: string[] = [];

      if (checkRules(postingScenario.postCandidateRules, post, errors, context)) {
        candidates.push([id, post, managerName]);
      } else {
        console.info(`Skipped post "${id}": ${errors.join(', ')}`);
      }
    }

    if (candidates.length === 0) {
      console.info(`No post candidates found.`);
      continue;
    }

    let candidate;

    if (candidates.length === 1) {
      console.info(`Found ${candidates.length} post candidate, selecting it...`);
      candidate = candidates[0];
    } else {
      console.info(`Found ${candidates.length} post candidates, selecting random one...`);
      candidate = candidates[Math.floor(Math.random() * candidates.length)] ?? undefined;
    }

    if (candidate) {
      return { sourceManager, entry: candidate };
    }

    return undefined;
  }

  return undefined;
}
