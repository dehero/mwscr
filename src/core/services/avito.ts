import type { InferOutput } from 'valibot';
import { nonEmpty, object, pipe, string } from 'valibot';
import { Publication } from '../entities/publication.js';
import type { PostingService } from '../entities/service.js';

export const AVITO_USERNAME = '8a8937fb057879595b5e7c941d5ff1eb';

export const AvitoPublication = object({ ...Publication.entries, id: pipe(string(), nonEmpty()) });
export type AvitoPublication = InferOutput<typeof AvitoPublication>;

export class Avito implements PostingService<AvitoPublication> {
  readonly id = 'av';
  readonly name = 'Avito';
  readonly merchOnly = true;

  getSubscriptionUrl(): string {
    return this.getUserProfileUrl(AVITO_USERNAME);
  }

  getUserProfileUrl(profileId: string) {
    return `https://avito.ru/brands/${profileId}`;
  }

  canPublishPost() {
    return false;
  }

  isPublication(_publication: Publication): _publication is AvitoPublication {
    return false;
  }

  getPublicationUrl(publication: Publication, _embed?: boolean) {
    return `https://avito.ru/${publication.id}`;
  }
}

export const avito = new Avito();
