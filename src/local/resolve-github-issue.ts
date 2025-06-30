import 'dotenv/config';
import { exchangeDraftsAndRejects } from './functions/exchange-drafts-and-rejects.js';
import { maintainPreviews } from './functions/maintain-previews.js';
import { resolveGithubIssue } from './functions/resolve-github-issue.js';

await resolveGithubIssue();

await exchangeDraftsAndRejects();

await maintainPreviews();
