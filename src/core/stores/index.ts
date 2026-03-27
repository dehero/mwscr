import { MultiStore } from '../entities/multi-store.js';
import { SiteStore } from './site-store.js';

export const siteStore = new SiteStore();
export const store = new MultiStore([siteStore]);
