import type { PostingServiceManager } from '../../core/entities/service.js';
import { instagramManager } from './instagram-manager.js';
import { telegramManager } from './telegram-manager.js';
import { vkManager } from './vk-manager.js';
import { youtubeManager } from './youtube-manager.js';

export const postingServiceManagers: PostingServiceManager[] = [
  instagramManager,
  youtubeManager,
  vkManager,
  telegramManager,
];
