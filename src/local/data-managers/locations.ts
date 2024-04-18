import { readFile } from 'fs/promises';

const LOCATIONS_FILENAME = './data/locations.lst';

let cachedLocations: string[] | undefined;

export async function getLocations(): Promise<string[]> {
  const currentCachedLocations = cachedLocations;
  if (currentCachedLocations) {
    return currentCachedLocations;
  }

  try {
    const data = await readFile(LOCATIONS_FILENAME, 'utf-8');
    if (!cachedLocations) {
      cachedLocations = data.split(/\r?\n/).filter(Boolean);
    }

    return cachedLocations;
  } catch (error) {
    const message = error instanceof Error ? error.message : error;
    throw new Error(`Error loading users: ${message}`);
  }
}

export async function findLocation(searchString: string): Promise<string | undefined> {
  const locations = await getLocations();
  const lowerCaseSearchString = searchString.toLocaleLowerCase();

  return locations.find((location) => location.toLocaleLowerCase() === lowerCaseSearchString);
}
