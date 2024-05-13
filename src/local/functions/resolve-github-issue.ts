import 'dotenv/config';
import type { Issues } from 'github-webhook-event-types';
import { githubIssueResolvers } from '../github-issue-resolvers/index.js';

export async function resolveGithubIssue() {
  if (!process.env.GITHUB_ACTION_CONTEXT) {
    throw new Error('No GitHub action context for importing issue');
  }

  let context;
  try {
    context = JSON.parse(process.env.GITHUB_ACTION_CONTEXT);
  } catch {
    throw new Error('Failed to parse GitHub action context');
  }

  const event = context.event as Issues;

  for (const label of event.issue.labels) {
    const resolver = githubIssueResolvers.find((resolver) => resolver.label === label.name);

    await resolver?.resolve(event.issue);
  }
}
