import type { Service } from '../entities/service.js';

export class Boosty implements Service {
  readonly id = 'by';
  readonly name = 'Boosty';

  getDonationUrl() {
    return 'https://boosty.to/mwscr/donate';
  }

  getUserProfileUrl(profileId: string) {
    return `https://boosty.to/${profileId}`;
  }
}

export const boosty = new Boosty();
