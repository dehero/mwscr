import type { PostingService } from '../../core/entities/service.js';
import * as instagram from './instagram-manager.js';
import * as telegram from './telegram-manager.js';
import * as vk from './vk-manager.js';
import * as youtube from './youtube-manager.js';

export const postingServices: PostingService[] = [instagram, youtube, vk, telegram];
