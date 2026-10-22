import type { InferOutput } from 'valibot';
import { integer, minValue, nonEmpty, number, object, pipe, string, union } from 'valibot';
import { Publication } from '../entities/publication.ts';
import { checkSchema } from '../entities/schema.ts';
import type { PostingService } from '../entities/service.ts';

export const AVITO_USERNAME = '8a8937fb057879595b5e7c941d5ff1eb';

export const AvitoPublication = object({
  ...Publication.entries,
  id: union([pipe(string(), nonEmpty()), pipe(number(), integer(), minValue(1))]),
});
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

  isPublication(publication: Publication): publication is AvitoPublication {
    return checkSchema(AvitoPublication, publication) && publication.service === this.id;
  }

  getPublicationUrl(publication: Publication, _embed?: boolean) {
    return `https://avito.ru/${publication.id}`;
  }
}

export const avito = new Avito();
