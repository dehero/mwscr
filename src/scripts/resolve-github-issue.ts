import 'dotenv/config';
import { exchangeDraftsAndRejects } from './functions/exchange-drafts-and-rejects.ts';
import { importResourcesToStore } from './functions/import-resources-to-store.ts';
import { maintainPreviews } from './functions/maintain-previews.ts';
import { resolveGithubIssue } from './functions/resolve-github-issue.ts';

await resolveGithubIssue();

await importResourcesToStore();

await exchangeDraftsAndRejects();

await maintainPreviews();
