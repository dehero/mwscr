import { DataManager } from '../../core/entities/data-manager.js';
import { locations } from './locations.js';
import { postsManagers } from './posts.js';
import { topics } from './topics.js';
import { users } from './users.js';

export const dataManager = new DataManager({
  postsManagers,
  locations,
  users,
  topics,
});
