import { DataReader } from './data-manager.js';
import type { Location } from './location.js';

export abstract class LocationsReader extends DataReader<Location> {
  readonly name = 'locations';
}
