import type { Location } from '../../core/entities/location.js';
import { LocationsReader } from '../../core/entities/locations-reader.js';

class SiteLocationsReader extends LocationsReader {
  protected async loadChunkData() {
    const data = await fetch('/data/locations.json').then((r) => r.json());

    if (!Array.isArray(data)) {
      throw new TypeError('Locations data must be an array');
    }

    return Object.fromEntries((data as Location[]).map((location): [string, Location] => [location.title, location]));
  }
}

export const locations = new SiteLocationsReader();
