import type { DataPatch } from '../entities/data-patch.ts';
import { dataPatchToString } from '../entities/data-patch.ts';
import type { GithubIssueDescriptor } from '../entities/github-issue.ts';
import { GITHUB_ISSUE_CREATE_URL } from '../entities/github-issue.ts';
import { dataPatchName, dataPatchText } from '../entities/github-issue-field.ts';
import type { Upload } from '../entities/upload.ts';
import { site } from '../services/site.ts';
import { stripCommonExtension } from '../utils/string-utils.ts';

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
