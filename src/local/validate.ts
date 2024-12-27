import 'dotenv/config';
import { importCommitAuthors } from './functions/import-commit-authors.js';
// import { checkPosts } from './functions/check-posts.js';

// await checkPosts();

await importCommitAuthors();
