import type { DataPatch } from '../entities/data-patch.js';
import { dataPatchToString } from '../entities/data-patch.js';
import type { GithubIssueDescriptor } from '../entities/github-issue.js';
import { GITHUB_ISSUE_CREATE_URL } from '../entities/github-issue.js';
import { dataPatchName, dataPatchText } from '../entities/github-issue-field.js';
import type { Upload } from '../entities/upload.js';
import { site } from '../services/site.js';
import { stripCommonExtension } from '../utils/string-utils.js';

export class DataPatchIssue implements GithubIssueDescriptor {
  readonly label = 'data-patch';

  createIssueUrl(patch?: DataPatch, meta?: Upload): string | undefined {
    const url = new URL(GITHUB_ISSUE_CREATE_URL);
    url.searchParams.set('labels', this.label);
    url.searchParams.set('template', `${this.label}.yml`);

    if (meta) {
      url.searchParams.set('title', stripCommonExtension(meta.originalName) || meta.name);
      url.searchParams.set(dataPatchName.id, site.getDataPatchSharingUrl(meta));
    } else if (patch) {
      url.searchParams.set(dataPatchText.id, dataPatchToString(patch, true));
    }

    const result = url.toString();
    if (result.length > 2048) {
      return undefined;
    }

    return result;
  }
}

export const dataPatchIssue = new DataPatchIssue();
