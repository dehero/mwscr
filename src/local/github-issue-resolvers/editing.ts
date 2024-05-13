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
} from '../../core/entities/field.js';
import { GITHUB_ISSUE_DEFAULT_TITLE, type GithubIssue } from '../../core/entities/github-issue.js';
import type { PostViolation } from '../../core/entities/post.js';
import {
  mergeAuthors,
  mergePostContents,
  POST_ADDONS,
  POST_ENGINES,
  POST_MARKS,
  POST_TYPES,
  POST_VIOLATIONS,
} from '../../core/entities/post.js';
import { label } from '../../core/github-issues/editing.js';
import { asArray } from '../../core/utils/common-utils.js';
import { findLocation } from '../data-managers/locations.js';
import { getPost, inbox, trash } from '../data-managers/posts.js';
import {
  extractIssueFieldValue,
  extractIssueTextareaValue,
  extractIssueUser,
  issueDropdownToInput,
} from './utils/issue-utils.js';

export * from '../../core/github-issues/editing.js';

export async function resolve(issue: GithubIssue) {
  const id = issue.title;
  const [post, manager] = await getPost(id, [inbox, trash]);
  const [userId, user] = await extractIssueUser(issue);

  if (!user.admin) {
    throw new Error(`Post ${label} is not allowed for non-administrator user "${userId}".`);
  }

  const typeStr = extractIssueFieldValue(postType, issue.body);
  const engineStr = extractIssueFieldValue(postEngine, issue.body);
  const addonStr = extractIssueFieldValue(postAddon, issue.body);
  const markStr = extractIssueFieldValue(postMark, issue.body);
  const violationStr = extractIssueFieldValue(postViolation, issue.body);
  const locationStr = extractIssueFieldValue(postLocation, issue.body);
  const requestText = extractIssueFieldValue(postRequestText, issue.body);
  const rawContent = extractIssueTextareaValue(postContent, issue.body)?.split(/\r?\n/).filter(Boolean);
  const rawTrash = extractIssueTextareaValue(postTrash, issue.body)?.split(/\r?\n/).filter(Boolean);
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
  post.type = POST_TYPES.find((type) => type === typeStr) ?? 'shot';
  post.tags = extractIssueFieldValue(postTags, issue.body)?.split(/\s+/).filter(Boolean);
  post.engine = POST_ENGINES.find((engine) => engine === engineStr);
  post.addon = POST_ADDONS.find((addon) => addon === addonStr);
  post.mark = POST_MARKS.find((mark) => mark === markStr);
  post.violation = [...Object.entries(POST_VIOLATIONS)].find(
    ([, title]) => title === violationStr,
  )?.[0] as PostViolation;

  if (!locationStr) {
    post.location = locationStr;
  } else {
    const location = await findLocation(locationStr);
    if (location) {
      post.location = location.title;
    }
  }

  if (post.request && requestText) {
    post.request.text = requestText;
  }

  await manager.updatePost(id);

  console.info(`Post "${id}" updated".`);
}

export async function createIssueTemplate() {
  return {
    name: 'Edit Post',
    description: 'Paste in the title the ID of post from inbox or trash.',
    title: GITHUB_ISSUE_DEFAULT_TITLE,
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
      issueDropdownToInput(postLocation),
      issueDropdownToInput(postMark),
      issueDropdownToInput(postViolation),
      postTrash,
      postRequestText,
    ],
  };
}
