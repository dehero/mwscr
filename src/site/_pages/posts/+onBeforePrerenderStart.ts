import { postsManagers } from '../../../scripts/data-managers/posts.js';
import { postsRoute } from '../../routes/posts-route.js';

export function onBeforePrerenderStart() {
  return postsManagers.map((manager) => postsRoute.createUrl({ managerName: manager.name }));
}
