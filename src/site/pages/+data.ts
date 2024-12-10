import { dataExtractor } from '../../local/data-managers/extractor.js';
import { getHomePageData } from '../components/HomePage/HomePage.data.js';

export const data = () => getHomePageData(dataExtractor);
