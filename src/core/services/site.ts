import type { Service } from '../entities/service.js';

export class Site implements Service {
  readonly id = 'mw';
  readonly name = 'Morrowind Screenshots';
  readonly origin = 'https://mwscr.dehero.site';

  getPostUrl(postId: string, managerName = 'posts') {
    return `${this.origin}/${managerName}/${postId}/`;
  }

  getUserProfileUrl(profileId: string) {
    return `${this.origin}/users/${profileId}/`;
  }
}

export const site = new Site();
