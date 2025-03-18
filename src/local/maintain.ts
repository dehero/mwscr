import 'dotenv/config';
import { createGithubIssueTemplates } from './functions/create-github-issue-templates.js';
import { createNewPost } from './functions/create-new-post.js';
import { exchangeInboxAndTrash } from './functions/exchange-inbox-and-trash.js';
// import { grabManualPosts } from './functions/grab-manual-posts.js';
import { importStoreInbox } from './functions/import-store-inbox.js';
import { importTelegramBotUpdates } from './functions/import-telegram-bot-updates.js';
import { maintainPreviews } from './functions/maintain-previews.js';
import { publishPosts } from './functions/publish-posts.js';
import { updatePosts } from './functions/update-posts.js';

await createGithubIssueTemplates();

// TODO: fix parsing captions (causing wrong tags in posts)
// await grabManualPosts();

await importStoreInbox();

await importTelegramBotUpdates();

await exchangeInboxAndTrash();

await updatePosts();

await createNewPost();

await publishPosts();

await maintainPreviews();

// Telegram waits for too long to disconnect, exit process manually
process.exit();
