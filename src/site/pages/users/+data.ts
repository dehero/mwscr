import { dataExtractor } from '../../../local/data-managers/extractor.js';
import { getUsersPageData } from '../../components/UsersPage/UsersPage.data.js';

export const data = () => getUsersPageData(dataExtractor);
