import type { PostEntry } from '../../core/entities/post.js';
import { mergePostContents, PostContentField, postViolationDescriptors } from '../../core/entities/post.js';
import type { DraftProposal } from '../../core/entities/posts-manager.js';
import { parseResourceUrl } from '../../core/entities/resource.js';
import { asArray, listItems } from '../../core/utils/common-utils.js';
import { drafts } from '../data-managers/posts.js';
import { importResourceToStore } from '../data-managers/store-resources.js';

export async function importResourcesToStore() {
  console.group(`Importing external resources to store...`);

  const importedUrls = new Map<string, PostEntry<DraftProposal>[]>();

  for await (const [id, post] of drafts.readAllEntries()) {
    for (const field of PostContentField.options) {
      const urls = asArray<string>(post[field]);
      const newUrls: string[] = [];

      for (const url of urls) {
        if (!url) {
          continue;
        }
        const { protocol } = parseResourceUrl(url);
        if (protocol === 'store:') {
          newUrls.push(url);
          continue;
        }

        try {
          const entries = await importResourceToStore(url, post, importedUrls);
          for (const [, draft] of entries) {
            if (field === 'content' && urls.length === 1) {
              if (!post.violation && draft.violation) {
                post.violation = draft.violation;
              }

              if (!post.title && draft.title) {
                post.title = draft.title;
              }
            }

            const violations = asArray(draft.violation);

            if (violations.length > 0) {
              console.error(
                `Resource "${url}" from "${id}" was not imported to store because of violations: ${listItems(
                  violations.map((violation) => postViolationDescriptors[violation].title),
                  true,
                  'and',
                )}`,
              );
              newUrls.push(url);
            } else {
              const content = asArray(draft.content);
              newUrls.push(...content);
              console.error(
                `Resource "${url}" from "${id}" was imported to store as ${listItems(content, true, 'and')}}`,
              );
            }
          }
        } catch (error) {
          if (error instanceof Error) {
            console.error(`Error importing resources to store: ${error.message}`);
          }
        }
      }

      post[field] = mergePostContents(newUrls);
    }
  }

  await drafts.save();

  console.groupEnd();
}
