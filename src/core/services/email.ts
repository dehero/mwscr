import type { Service, ServiceMessagingOptions } from '../entities/service.js';

export class Email implements Service {
  readonly id = 'em';
  readonly name = 'E-mail';

  getUserProfileUrl(profileId: string) {
    return `mailto:${profileId}`;
  }

  getUserMessagingUrl(profileId: string, options?: ServiceMessagingOptions) {
    const { subject, body } = options || {};

    const args = [`subject=${encodeURIComponent(['mwscr', subject].filter(Boolean).join(' - '))}`];

    if (body) {
      args.push(`body=${encodeURIComponent(body)}`);
    }

    let url = `mailto:${encodeURIComponent(profileId)}`;
    if (args.length > 0) {
      url += `?${args.join('&')}`;
    }
    return url;
  }
}

export const email = new Email();
