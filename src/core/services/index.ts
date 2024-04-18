import type { PostingServiceInfo, Service } from '../entities/service.js';
import * as github from './github.js';
import * as instagram from './instagram.js';
import * as telegram from './telegram.js';
import * as vk from './vk.js';
import * as youtube from './youtube.js';

export const services: Service[] = [instagram, youtube, vk, telegram, github];
export const postingServiceInfos: PostingServiceInfo[] = [instagram, youtube, vk, telegram];
