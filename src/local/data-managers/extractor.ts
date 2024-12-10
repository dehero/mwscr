import { DataExtractor } from '../../core/entities/data-extractor.js';
import { locations } from './locations.js';
import { postsManagers } from './posts.js';
import { users } from './users.js';

export const dataExtractor = new DataExtractor({
  postsManagers,
  locations,
  users,
});
