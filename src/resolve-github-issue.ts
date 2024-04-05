import 'dotenv/config';
import { exchangeInboxAndTrash } from './functions/exchange-inbox-and-trash.js';
import { renderDocs } from './functions/render-docs.js';
import { resolveGithubIssue } from './functions/resolve-github-issue.js';

await resolveGithubIssue();

await exchangeInboxAndTrash();

await renderDocs();
