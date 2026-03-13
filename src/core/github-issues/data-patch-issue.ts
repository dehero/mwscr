import type { DataPatch } from '../entities/data-patch.js';
import { dataPatchToString, getDataPatchName } from '../entities/data-patch.js';
import type { GithubIssueDescriptor } from '../entities/github-issue.js';
import { GITHUB_ISSUE_CREATE_URL } from '../entities/github-issue.js';
import { dataPatchText } from '../entities/github-issue-field.js';

export class DataPatchIssue implements GithubIssueDescriptor {
  readonly label = 'data-patch';

  createIssueUrl(patch?: DataPatch): string {
    const url = new URL(GITHUB_ISSUE_CREATE_URL);
    url.searchParams.set('labels', this.label);
    url.searchParams.set('template', `${this.label}.yml`);
    url.searchParams.set('title', patch ? getDataPatchName(patch) : '');
    url.searchParams.set(dataPatchText.id, patch ? dataPatchToString(patch, true) : '');

    return url.toString();
  }
}

export const dataPatchIssue = new DataPatchIssue();
