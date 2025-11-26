import type { InferOutput } from 'valibot';
import { nonEmpty, object, pipe, string } from 'valibot';
import { Publication } from '../entities/publication.js';
import type { PostingService } from '../entities/service.js';

export const BOOSTY_USERNAME = 'mwscr';

export const BoostyPublication = object({ ...Publication.entries, id: pipe(string(), nonEmpty()) });
export type BoostyPublication = InferOutput<typeof BoostyPublication>;

export class Boosty implements PostingService<BoostyPublication> {
  readonly id = 'bt';
  readonly name = 'Boosty';
  readonly description =
    'Buy merch post on Boosty and the administrator will contact you to confirm the delivery address. Shipping cost and the transfer fee included in the price.';

  readonly sponsorshipName = 'Boosty Tip';
  readonly merchOnly = true;

  getSponsorshipUrl() {
    return 'https://boosty.to/mwscr/donate';
  }

  getSubscriptionUrl(): string {
    return this.getUserProfileUrl(BOOSTY_USERNAME);
  }

  getUserProfileUrl(profileId: string) {
    return `https://boosty.to/${profileId}`;
  }

  canPublishPost() {
    return false;
  }

  isPublication(_publication: Publication): _publication is BoostyPublication {
    return false;
  }

  getPublicationUrl(publication: Publication, _embed?: boolean) {
    return `https://boosty.to/${BOOSTY_USERNAME}/posts/${publication.id}`;
  }
}

export const boosty = new Boosty();
