import { MultiStoreManager } from '../../core/entities/multi-store.ts';
import { LocalStoreManager } from './local-store-manager.ts';
import { S3StoreManager } from './s3-store-manager.ts';
import { SiteStoreManager } from './site-store-manager.ts';
import { YandexDiskManager } from './yandex-disk-manager.ts';

export const siteStoreManager = new SiteStoreManager();
export const yandexDiskManager = new YandexDiskManager();
export const localStoreManager = new LocalStoreManager();
export const s3StoreManager = new S3StoreManager();

export const storeManager = new MultiStoreManager([siteStoreManager, yandexDiskManager]);
