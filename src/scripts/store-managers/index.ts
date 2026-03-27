import { MultiStoreManager } from '../../core/entities/multi-store.js';
import { LocalStoreManager } from './local-store-manager.js';
import { SiteStoreManager } from './site-store-manager.js';
import { YandexDiskManager } from './yandex-disk-manager.js';

export const siteStoreManager = new SiteStoreManager();
export const yandexDiskManager = new YandexDiskManager();
export const localStoreManager = new LocalStoreManager();

export const storeManager = new MultiStoreManager([localStoreManager, yandexDiskManager, siteStoreManager]);
