import { stringToDataPatch } from '../../core/entities/data-patch.js';
import { type GithubIssue } from '../../core/entities/github-issue.js';
import { dataPatchText } from '../../core/entities/github-issue-field.js';
import { label } from '../../core/github-issues/data-patch.js';
import { dataManager } from '../data-managers/manager.js';
import { extractIssueTextareaValue, extractIssueUser } from './utils/issue-utils.js';

export * from '../../core/github-issues/data-patch.js';

export async function resolve(issue: GithubIssue) {
  const [userId, user] = await extractIssueUser(issue);

  if (!user.admin) {
    throw new Error(`Data patching is not allowed for non-administrator user "${userId}".`);
  }

  const rawDataPatch = extractIssueTextareaValue(dataPatchText, issue.body) ?? '';
  dataManager.mergePatch(stringToDataPatch(rawDataPatch));

  await dataManager.save();

  console.info('Data patched.');
}

export async function createIssueTemplate() {
  return {
    name: 'Patch Data',
    description: "Apply JSON patch to project's data.",
    title: 'data-patch',
    labels: [label],
    body: [dataPatchText],
  };
}
