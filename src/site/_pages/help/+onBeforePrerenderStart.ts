import { dataManager } from '../../../scripts/data-managers/manager.js';
import { helpRoute } from '../../routes/help-route.js';

export async function onBeforePrerenderStart() {
  const entries = await dataManager.topics.getAllEntries();

  return entries.map(([topicId]) => helpRoute.createUrl({ topicId }));
}
