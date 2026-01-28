import { dataManager } from '../../scripts/data-managers/manager.js';
import { getHomePageData } from '../components/HomePage/HomePage.data.js';

export const data = () => getHomePageData(dataManager);
