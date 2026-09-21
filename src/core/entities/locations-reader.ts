import { ListReader } from './list-manager.ts';
import type { Location } from './location.ts';

export abstract class LocationsReader extends ListReader<Location> {
  readonly name = 'locations';
}
