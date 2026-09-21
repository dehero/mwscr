import { DataManager } from '../../core/entities/data-manager.ts';
import { locations } from './locations.ts';
import { postsManagers } from './posts.ts';
import { topics } from './topics.ts';
import { users } from './users.ts';

export const dataManager = new DataManager({
  postsManagers,
  locations,
  users,
  topics,
});
