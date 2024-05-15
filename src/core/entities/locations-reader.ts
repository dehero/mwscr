import { DataReader } from './data-manager.js';
import type { Location } from './location.js';

export abstract class LocationsReader extends DataReader<Location> {
  readonly name = 'locations';

  protected isItemEqual(a: Location, b: Partial<Location>): boolean {
    return (
      a.title.toLocaleLowerCase() === b.title?.toLocaleLowerCase() ||
      a.titleRu?.toLocaleLowerCase() === b.titleRu?.toLocaleLowerCase()
    );
  }
}
