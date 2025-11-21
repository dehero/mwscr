import { InferOutput, nonEmpty, object, pipe, string, undefined } from 'valibot';
import type { PostingService } from '../entities/service.js';
import { Post } from '../entities/post.js';
import { Publication } from '../entities/publication.js';

export const BOOSTY_USERNAME = 'mwscr';

export const BoostyPublication = object({ ...Publication.entries, id: pipe(string(), nonEmpty()) });
export type BoostyPublication = InferOutput<typeof BoostyPublication>;

export class Boosty implements PostingService<BoostyPublication> {
  readonly id = 'by';
  readonly name = 'Boosty';
  readonly sponsorshipName = 'Boosty Tip';

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
    return `https://boosty.to/${BOOSTY_USERNAME}/${publication.id}`;
  }
}

export const boosty = new Boosty();
