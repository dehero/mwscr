import type { PostingService, Service } from '../entities/service.ts';
import { avito } from './avito.ts';
import { boosty } from './boosty.ts';
import { email } from './email.ts';
import { github } from './github.ts';
import { instagram } from './instagram.ts';
import { max } from './max.ts';
import { site } from './site.ts';
import { telegram } from './telegram.ts';
import { vk } from './vk.ts';
import { youtube } from './youtube.ts';

export const services: Service[] = [instagram, youtube, vk, telegram, github, email, site, boosty, avito, max];
export const postingServices: PostingService[] = [instagram, youtube, vk, telegram, boosty, avito, max];
