import type { PostingServiceManager } from '../../core/entities/service.ts';
import { avitoManager } from './avito-manager.ts';
import { instagramManager } from './instagram-manager.ts';
import { maxManager } from './max-manager.ts';
import { telegramManager } from './telegram-manager.ts';
import { vkManager } from './vk-manager.ts';
import { youtubeManager } from './youtube-manager.ts';

export const postingServiceManagers: PostingServiceManager[] = [
  instagramManager,
  youtubeManager,
  vkManager,
  avitoManager,
  telegramManager,
  maxManager,
];
