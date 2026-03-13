import fetch from 'node-fetch';
import type { DataPatch } from '../../core/entities/data-patch.js';
import { stringToDataPatch } from '../../core/entities/data-patch.js';
import type { GithubIssue, GithubIssueResolver } from '../../core/entities/github-issue.js';
import { dataPatchText, dataPatchUrl } from '../../core/entities/github-issue-field.js';
import { DataPatchIssue } from '../../core/github-issues/data-patch-issue.js';
import { dataManager } from '../data-managers/manager.js';
import { extractIssueFieldValue, extractIssueTextareaValue, extractIssueUser } from './utils/issue-utils.js';

export class DataPatchIssueResolver extends DataPatchIssue implements GithubIssueResolver {
  async resolve(issue: GithubIssue) {
    const [userId, user] = await extractIssueUser(issue);

    if (!user.admin) {
      throw new Error(`Data patching is not allowed for non-administrator user "${userId}".`);
    }

    let patch: DataPatch;

    const dataPatchURL = extractIssueFieldValue(dataPatchUrl, issue.body);
    if (dataPatchURL) {
      patch = (await (await fetch(dataPatchURL)).json()) as DataPatch;
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
      body: [dataPatchText],
    };
  }
}

export const dataPatchIssueResolver = new DataPatchIssueResolver();
