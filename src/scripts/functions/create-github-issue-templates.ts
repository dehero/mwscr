import { writeFile } from 'fs/promises';
import yaml from 'js-yaml';
import { githubIssueResolvers } from '../github-issue-resolvers/index.js';
import { createEmptyDir } from '../utils/file-utils.js';

const GITHUB_ISSUE_TEMPLATE_PATH = '.github/ISSUE_TEMPLATE';

export async function createGithubIssueTemplates() {
  console.group('Creating GitHub issue templates...');

  await createEmptyDir(GITHUB_ISSUE_TEMPLATE_PATH);

  for (const resolver of githubIssueResolvers) {
    try {
      const template = await resolver.createIssueTemplate();
      const filename = `${GITHUB_ISSUE_TEMPLATE_PATH}/${resolver.label}.yml`;

      const file = yaml.dump(template);

      await writeFile(filename, file);
      console.info(`Created "${filename}".`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error creating GitHub issue template for ${resolver.label}: ${error.message}`);
      }
    }
  }

  console.groupEnd();
}
