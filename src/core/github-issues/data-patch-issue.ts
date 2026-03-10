import { DataPatch, dataPatchToString, getDataPatchName } from '../entities/data-patch.js';
import { dataPatchText } from '../entities/github-issue-field.js';
import { GITHUB_ISSUE_CREATE_URL, GithubIssueDescriptor } from '../entities/github-issue.js';

export class DataPatchIssue implements GithubIssueDescriptor {
  readonly label = 'data-patch';

  createIssueUrl(patch?: DataPatch): string {
    const url = new URL(GITHUB_ISSUE_CREATE_URL);
    url.searchParams.set('labels', this.label);
    url.searchParams.set('template', `${this.label}.yml`);
    url.searchParams.set('title', getDataPatchName(patch));
    url.searchParams.set(dataPatchText.id, patch ? dataPatchToString(patch, true) : '');

    return url.toString();
  }
}

export const dataPatchIssue = new DataPatchIssue();
