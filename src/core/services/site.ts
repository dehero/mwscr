import type { Locale } from '../entities/intl.js';
import type { Service } from '../entities/service.js';
import type { Upload } from '../entities/upload.js';

export class Site implements Service {
  readonly id = 'mw';
  readonly name = 'Morrowind Screenshots';
  readonly origin = typeof window !== 'undefined' ? window.origin : 'https://mwscr.dehero.site';
  readonly originEn = 'https://mwscr.dehero.site';
  readonly originRu = 'https://mwscr.dehero.ru';

  getDataPatchSharingUrl(meta: Upload) {
    return `${this.origin}/#patch-loading/${meta.name}`;
  }

  getPostUrl(postId: string, managerName: string, locale: Locale) {
    const origin = locale === 'ru' ? this.originRu : this.originEn;

    return `${origin}/${managerName}/${postId}/`;
  }

  getUserProfileUrl(profileId: string) {
    return `${this.origin}/users/${profileId}/`;
  }
}

export const site = new Site();
