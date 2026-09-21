import 'dotenv/config';
import { createGithubIssueTemplates } from './functions/create-github-issue-templates.ts';
import { createNewPost } from './functions/create-new-post.ts';
import { exchangeDraftsAndRejects } from './functions/exchange-drafts-and-rejects.ts';
import { importResourcesToStore } from './functions/import-resources-to-store.ts';
// import { grabManualPosts } from './functions/grab-manual-posts.ts';
import { importStoreInbox } from './functions/import-store-inbox.ts';
import { importTelegramBotUpdates } from './functions/import-telegram-bot-updates.ts';
import { maintainPreviews } from './functions/maintain-previews.ts';
import { publishPosts } from './functions/publish-posts.ts';
// import { syncStore } from './functions/sync-store.ts';
import { updatePublications } from './functions/update-publications.ts';
import { updateUsers } from './functions/update-users.ts';

await createGithubIssueTemplates();

// TODO: fix parsing captions (causing wrong tags in posts)
// await grabManualPosts();

// Skip full synchronization for now, because inbox is the only folder where files could be added manually
// Using syncStoreResource inside importStoreInbox to upload files added to inbox to other stores
// await syncStore();

await importStoreInbox();

await importResourcesToStore();

await importTelegramBotUpdates();

await exchangeDraftsAndRejects();

await updatePublications();

await updateUsers();

await createNewPost();

await publishPosts();

await maintainPreviews();

// Telegram waits for too long to disconnect, exit process manually
process.exit();
