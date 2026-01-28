import type { Location } from '../../core/entities/location.js';
import { LocationsReader } from '../../core/entities/locations-reader.js';
import { loadYaml } from './utils/yaml.js';

export const LOCATIONS_FILENAME = './data/locations.yml';

class LocalLocationsReader extends LocationsReader {
  protected async loadChunkData() {
    const data = await loadYaml(LOCATIONS_FILENAME);

    if (!Array.isArray(data)) {
      throw new TypeError('Locations data must be an array');
    }

    return Object.fromEntries(data.map((location): [string, Location] => [location.title, location]));
  }
}

export const locations = new LocalLocationsReader();
