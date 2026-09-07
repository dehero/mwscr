import { MultiStore } from '../../core/entities/multi-store.js';
import { S3Store } from './s3-store.js';
import { SiteStore } from './site-store.js';

/**
 * @deprecated Use S3 storage instead
 */
export const siteStore = new SiteStore();

export const s3Store = new S3Store();
export const store = new MultiStore([s3Store]);
