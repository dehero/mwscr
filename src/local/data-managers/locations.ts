import type { Location } from '../../core/entities/location.js';
import { loadYaml } from './utils/yaml.js';

const LOCATIONS_FILENAME = './data/locations.yml';

let cachedLocations: Location[] | undefined;

export async function getLocations(): Promise<Location[]> {
  const currentCachedLocations = cachedLocations;
  if (currentCachedLocations) {
    return currentCachedLocations;
  }

  try {
    const data = (await loadYaml(LOCATIONS_FILENAME)) as Location[];
    if (!cachedLocations) {
      cachedLocations = data;
    }

    return cachedLocations;
  } catch (error) {
    const message = error instanceof Error ? error.message : error;
    throw new Error(`Error loading locations: ${message}`);
  }
}

export async function findLocation(searchString: string): Promise<Location | undefined> {
  const locations = await getLocations();
  const lowerCaseSearchString = searchString.toLocaleLowerCase();

  return locations.find((location) => location.title.toLocaleLowerCase() === lowerCaseSearchString);
}
