import type { PostingService, Service } from '../entities/service.js';
import * as GitHub from './github.js';
import * as Instagram from './instagram.js';
import * as Telegram from './telegram.js';
import * as VK from './vk.js';
import * as YouTube from './youtube.js';

export const services: Service[] = [Instagram, YouTube, VK, Telegram, GitHub];
export const postingServices: PostingService[] = [Instagram, YouTube, VK, Telegram];
