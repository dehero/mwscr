import { ListReader } from './list-manager.js';
import type { Location } from './location.js';

export abstract class LocationsReader extends ListReader<Location> {
  readonly name = 'locations';
}
