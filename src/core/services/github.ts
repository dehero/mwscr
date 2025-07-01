import type { Service } from '../entities/service.js';
import type { UserProfile } from '../entities/user.js';

export class GitHub implements Service {
  readonly id = 'gh';
  readonly name = 'GitHub';

  getUserProfileUrl(profileId: string) {
    return `https://github.com/${profileId}`;
  }

  parseCommitAuthor(author: string): UserProfile {
    const profile: UserProfile = { service: this.id };
    const [, name, email] = /^(.*)<[^<]+>$/.exec(author) || [];

    profile.name = name;
    profile.email = email;

    if (email) {
      const [, id, username] = /^(\d+)\+([^@]+)\@users\.noreply\.github\.com$/.exec(email) || [];

      profile.id = id;
      profile.username = username;
    }

    return profile;
  }
}

export const github = new GitHub();
