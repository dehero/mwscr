import type { Location } from '../../core/entities/location.js';
import { LocationsReader } from '../../core/entities/locations-reader.js';

class SiteLocationsReader extends LocationsReader {
  getChunkNames = async () => [''];

  getItemChunkName = () => '';

  protected async loadChunk() {
    const { default: data } = await import('../../../data/locations.yml');

    return new Map((data as Location[]).map((location) => [location.title, location]));
  }
}

export const locations = new SiteLocationsReader();
