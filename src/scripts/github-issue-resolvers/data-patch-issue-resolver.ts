import type { DataPatch } from '../../core/entities/data-patch.ts';
import { stringToDataPatch } from '../../core/entities/data-patch.ts';
import type { GithubIssue, GithubIssueResolver } from '../../core/entities/github-issue.ts';
import { dataPatchName, dataPatchText } from '../../core/entities/github-issue-field.ts';
import { extractUploadFileName } from '../../core/entities/upload.ts';
import { DataPatchIssue } from '../../core/github-issues/data-patch-issue.ts';
import { dataManager } from '../data-managers/manager.ts';
import { readResource } from '../data-managers/resources.ts';
import { extractIssueFieldValue, extractIssueTextareaValue, extractIssueUser } from './utils/issue-utils.ts';

export class DataPatchIssueResolver extends DataPatchIssue implements GithubIssueResolver {
  async resolve(issue: GithubIssue) {
    const [userId, user] = await extractIssueUser(issue);

    if (!user.admin) {
      throw new Error(`Data patching is not allowed for non-administrator user "${userId}".`);
    }

    let patch: DataPatch;

    const rawName = extractIssueFieldValue(dataPatchName, issue.body);
    let url;

    if (rawName) {
      const uploadName = extractUploadFileName(rawName);
      if (uploadName) {
        url = `uploads:/${uploadName}`;
      }
    }

    if (url) {
      const [data] = await readResource(url);
      patch = stringToDataPatch(typeof data === 'string' ? data : data.toString('utf8'));
    } else {
      const rawDataPatch = extractIssueTextareaValue(dataPatchText, issue.body) ?? '';
      patch = stringToDataPatch(rawDataPatch);
    }

    dataManager.mergePatch(patch);

    await dataManager.save();

    console.info('Data patched.');
  }

  async createIssueTemplate() {
    return {
      name: 'Patch Data',
      description: "Apply JSON patch to project's data.",
      title: 'data-patch',
      labels: [this.label],
      body: [dataPatchName, dataPatchText],
    };
  }
}

export const dataPatchIssueResolver = new DataPatchIssueResolver();
