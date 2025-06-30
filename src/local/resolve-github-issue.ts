import 'dotenv/config';
import { exchangeDraftsAndTrash } from './functions/exchange-drafts-and-trash.js';
import { maintainPreviews } from './functions/maintain-previews.js';
import { resolveGithubIssue } from './functions/resolve-github-issue.js';

await resolveGithubIssue();

await exchangeDraftsAndTrash();

await maintainPreviews();
