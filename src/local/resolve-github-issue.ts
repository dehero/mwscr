import 'dotenv/config';
import { exchangeInboxAndTrash } from './functions/exchange-inbox-and-trash.js';
import { maintainPreviews } from './functions/maintain-previews.js';
import { resolveGithubIssue } from './functions/resolve-github-issue.js';

await resolveGithubIssue();

await exchangeInboxAndTrash();

await maintainPreviews();
