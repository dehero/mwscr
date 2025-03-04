import { type GithubIssue } from '../../core/entities/github-issue.js';
import {
  postAddon,
  postAuthor,
  postContent,
  postEngine,
  postLocation,
  postMark,
  postRequestText,
  postTags,
  postTitle,
  postTitleRu,
  postTrash,
  postType,
  postViolation,
} from '../../core/entities/github-issue-field.js';
import { searchListReaderItem } from '../../core/entities/list-manager.js';
import { locationMatchesString } from '../../core/entities/location.js';
import {
  mergeAuthors,
  mergePostContents,
  mergePostLocations,
  PostAddon,
  PostEngine,
  PostMark,
  PostType,
  PostViolation,
} from '../../core/entities/post.js';
import { ResourceUrl } from '../../core/entities/resource.js';
import { safeParseSchema } from '../../core/entities/schema.js';
import { label } from '../../core/github-issues/post-editing.js';
import { asArray } from '../../core/utils/common-utils.js';
import { locations } from '../data-managers/locations.js';
import { inbox, trash } from '../data-managers/posts.js';
import {
  extractIssueFieldValue,
  extractIssueTextareaValue,
  extractIssueUser,
  issueDropdownToInput,
} from './utils/issue-utils.js';

export * from '../../core/github-issues/post-editing.js';

export async function resolve(issue: GithubIssue) {
  const id = issue.title;
  const [post, manager] = await searchListReaderItem(id, [inbox, trash]);
  const [userId, user] = await extractIssueUser(issue);

  if (!user.admin) {
    throw new Error(`Post ${label} is not allowed for non-administrator user "${userId}".`);
  }

  const typeStr = extractIssueFieldValue(postType, issue.body);
  const engineStr = extractIssueFieldValue(postEngine, issue.body);
  const addonStr = extractIssueFieldValue(postAddon, issue.body);
  const markStr = extractIssueFieldValue(postMark, issue.body);
  const violationStr = extractIssueFieldValue(postViolation, issue.body);
  const rawLocation = extractIssueTextareaValue(postLocation, issue.body)?.split(/\r?\n/).filter(Boolean);
  const requestText = extractIssueFieldValue(postRequestText, issue.body);
  const rawContent = extractIssueTextareaValue(postContent, issue.body)
    ?.split(/\r?\n/)
    .map((url) => safeParseSchema(ResourceUrl, url))
    .filter((url): url is ResourceUrl => typeof url !== 'undefined');
  const rawTrash = extractIssueTextareaValue(postTrash, issue.body)
    ?.split(/\r?\n/)
    .map((url) => safeParseSchema(ResourceUrl, url))
    .filter((url): url is ResourceUrl => typeof url !== 'undefined');
  const oldContent = post.content;
  const oldTrash = post.trash;

  post.title = extractIssueFieldValue(postTitle, issue.body);
  post.titleRu = extractIssueFieldValue(postTitleRu, issue.body);
  post.content = mergePostContents(
    rawContent,
    asArray(oldTrash).filter((url) => !rawTrash?.includes(url)),
  );
  post.trash = mergePostContents(
    rawTrash,
    asArray(oldContent).filter((url) => !rawContent?.includes(url)),
  );
  post.author = mergeAuthors(extractIssueFieldValue(postAuthor, issue.body)?.split(/\s+/).filter(Boolean));
  post.type = safeParseSchema(PostType, typeStr) ?? 'shot';
  post.tags = extractIssueFieldValue(postTags, issue.body)?.split(/\s+/).filter(Boolean);
  post.engine = safeParseSchema(PostEngine, engineStr);
  post.addon = safeParseSchema(PostAddon, addonStr);
  post.mark = safeParseSchema(PostMark, markStr);
  post.violation = safeParseSchema(PostViolation, violationStr);
  post.location = mergePostLocations(
    rawLocation
      ? (
          await locations.filterEntries((location) => rawLocation.some((str) => locationMatchesString(location, str)))
        ).map(([id]) => id)
      : undefined,
  );

  if (post.request && requestText) {
    post.request.text = requestText;
  }

  await manager.save();

  console.info(`Post "${id}" updated.`);
}

export async function createIssueTemplate() {
  return {
    name: 'Edit Post',
    description: 'Paste in the title the ID of post.',
    labels: [label],
    body: [
      postContent,
      postTitle,
      postTitleRu,
      issueDropdownToInput(postType),
      postAuthor,
      issueDropdownToInput(postEngine),
      issueDropdownToInput(postAddon),
      postTags,
      postLocation,
      issueDropdownToInput(postMark),
      issueDropdownToInput(postViolation),
      postTrash,
      postRequestText,
    ],
  };
}
