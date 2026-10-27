import type { InferOutput } from 'valibot';
import { integer, minValue, nonEmpty, number, object, pipe, string, union } from 'valibot';
import { Publication } from '../entities/publication.ts';
import { checkSchema } from '../entities/schema.ts';
import type { PostingService } from '../entities/service.ts';

export const OZON_SELLER_ID = 'dehero';

export const OzonPublication = object({
  ...Publication.entries,
  id: union([pipe(string(), nonEmpty()), pipe(number(), integer(), minValue(1))]),
});
export type OzonPublication = InferOutput<typeof OzonPublication>;

export class Ozon implements PostingService<OzonPublication> {
  readonly id = 'oz';
  readonly name = 'Ozon';
  readonly merchOnly = true;

  getSubscriptionUrl(): string {
    return this.getUserProfileUrl(OZON_SELLER_ID);
  }

  getUserProfileUrl(profileId: string) {
    return `https://ozon.ru/seller/${profileId}`;
  }

  canPublishPost() {
    return false;
  }

  isPublication(publication: Publication): publication is OzonPublication {
    return checkSchema(OzonPublication, publication) && publication.service === this.id;
  }

  getPublicationUrl(publication: Publication, _embed?: boolean) {
    return `https://ozon.ru/t/${publication.id}`;
  }
}

export const ozon = new Ozon();
