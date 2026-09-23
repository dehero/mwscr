import { MultiStore } from '../../core/entities/multi-store.ts';
import { S3Store } from './s3-store.ts';
import { SiteStore } from './site-store.ts';

/**
 * @deprecated Use S3 storage instead
 */
export const siteStore = new SiteStore();

export const s3Store = new S3Store();
export const store = new MultiStore([s3Store]);
