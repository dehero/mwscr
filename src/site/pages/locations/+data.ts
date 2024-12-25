import { dataExtractor } from '../../../local/data-managers/extractor.js';
import { getLocationsPageData } from '../../components/LocationsPage/LocationsPage.data.js';

export const data = () => getLocationsPageData(dataExtractor);
