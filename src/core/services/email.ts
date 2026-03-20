import type { Service, ServiceMessagingOptions } from '../entities/service.js';
import type { Upload } from '../entities/upload.js';
import { stripCommonExtension } from '../utils/string-utils.js';
import { site } from './site.js';

export class Email implements Service {
  readonly id = 'em';
  readonly name = 'E-mail';

  getDataPatchSharingUrl(meta: Upload) {
    return this.getUserMessagingUrl('mwscr@dehero.site', {
      subject: stripCommonExtension(meta.originalName),
      body: `Check out this data patch: ${site.getDataPatchSharingUrl(meta)}`,
    });
  }

  getUserProfileUrl(profileId: string) {
    return `mailto:${profileId}`;
  }

  getUserMessagingUrl(profileId: string, options?: ServiceMessagingOptions) {
    const { subject, body } = options || {};

    const args = [`subject=${encodeURIComponent(subject || 'mwscr')}`];

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
