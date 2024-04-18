import type { PostingService } from '../../core/entities/service.js';
import * as instagram from './instagram.js';
import * as telegram from './telegram.js';
import * as vk from './vk.js';
import * as youtube from './youtube.js';

export const postingServices: PostingService[] = [instagram, youtube, vk, telegram];
