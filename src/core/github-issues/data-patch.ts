import { type DataPatch, dataPatchToString, getDataPatchName } from '../entities/data-patch.js';
import { GITHUB_ISSUE_CREATE_URL } from '../entities/github-issue.js';
import { dataPatchText } from '../entities/github-issue-field.js';

export const label = 'data-patch';

export function createIssueUrl(patch?: DataPatch): string {
  const url = new URL(GITHUB_ISSUE_CREATE_URL);
  url.searchParams.set('labels', label);
  url.searchParams.set('template', `${label}.yml`);
  url.searchParams.set('title', getDataPatchName(patch));
  url.searchParams.set(dataPatchText.id, patch ? dataPatchToString(patch, true) : '');

  return url.toString();
}
