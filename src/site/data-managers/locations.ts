import type { Location } from '../../core/entities/location.js';
import { LocationsReader } from '../../core/entities/locations-reader.js';

class SiteLocationsReader extends LocationsReader {
  protected async loadChunkData() {
    const { default: data } = await import('../../../data/locations.yml');

    if (!Array.isArray(data)) {
      throw new TypeError('Locations data must be an array');
    }

    return (data as Location[]).map((location): [string, Location] => [location.title, location]);
  }
}

export const locations = new SiteLocationsReader();
