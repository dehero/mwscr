import type { DataPatch } from '../../core/entities/data-patch.js';
import { stringToDataPatch } from '../../core/entities/data-patch.js';
import type { GithubIssue, GithubIssueResolver } from '../../core/entities/github-issue.js';
import { dataPatchName, dataPatchText } from '../../core/entities/github-issue-field.js';
import { extractUploadFileName } from '../../core/entities/upload.js';
import { DataPatchIssue } from '../../core/github-issues/data-patch-issue.js';
import { dataManager } from '../data-managers/manager.js';
import { readResource } from '../data-managers/resources.js';
import { extractIssueFieldValue, extractIssueTextareaValue, extractIssueUser } from './utils/issue-utils.js';

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
      if (typeof data !== 'string') {
        throw new TypeError(`Error reading data patch from URL "${url}".`);
      }
      patch = stringToDataPatch(data);
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
