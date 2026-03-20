import type { Service } from '../entities/service.js';
import type { Upload } from '../entities/upload.js';

export class Site implements Service {
  readonly id = 'mw';
  readonly name = 'Morrowind Screenshots';
  readonly origin = globalThis.window ? window.origin : 'https://mwscr.dehero.site';

  getDataPatchSharingUrl(meta: Upload) {
    return `${this.origin}/#patch-loading/${meta.name}`;
  }

  getPostUrl(postId: string, managerName: string) {
    return `${this.origin}/${managerName}/${postId}/`;
  }

  getUserProfileUrl(profileId: string) {
    return `${this.origin}/users/${profileId}/`;
  }
}

export const site = new Site();
