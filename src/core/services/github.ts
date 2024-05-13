import type { Service } from '../entities/service.js';

export class GitHub implements Service {
  readonly id = 'gh';
  readonly name = 'GitHub';

  getUserProfileUrl(profileId: string) {
    return `https://github.com/${profileId}`;
  }
}

export const github = new GitHub();
