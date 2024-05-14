import type { DataReaderChunk } from '../../core/entities/data-manager.js';
import type { Location } from '../../core/entities/location.js';
import { LocationsReader } from '../../core/entities/locations-reader.js';
import { loadYaml } from './utils/yaml.js';

const LOCATIONS_FILENAME = './data/locations.yml';

class LocalLocationsReader extends LocationsReader {
  private cache: DataReaderChunk<Location> | undefined;

  getChunkNames = async () => [LOCATIONS_FILENAME];

  getItemChunkName = () => LOCATIONS_FILENAME;

  protected isItemEqual(a: Location, b: Partial<Location>): boolean {
    return Boolean(b.title && a.title.toLocaleLowerCase() === b.title.toLocaleLowerCase());
  }

  protected async loadChunk(chunkName: string) {
    const currentCache = this.cache;
    if (currentCache) {
      return currentCache;
    }

    try {
      const data = (await loadYaml(chunkName)) as Location[];
      if (!this.cache) {
        this.cache = new Map(data.map((location) => [location.title, location]));
      }

      return this.cache;
    } catch (error) {
      const message = error instanceof Error ? error.message : error;
      throw new Error(`Error loading locations: ${message}`);
    }
  }
}

export const locations = new LocalLocationsReader();
