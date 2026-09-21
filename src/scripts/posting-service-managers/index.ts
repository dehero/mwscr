import type { PostingServiceManager } from '../../core/entities/service.ts';
import { instagramManager } from './instagram-manager.ts';
import { maxManager } from './max-manager.ts';
import { telegramManager } from './telegram-manager.ts';
import { vkManager } from './vk-manager.ts';
import { youtubeManager } from './youtube-manager.ts';

export const postingServiceManagers: PostingServiceManager[] = [
  instagramManager,
  youtubeManager,
  vkManager,
  telegramManager,
  maxManager,
];
