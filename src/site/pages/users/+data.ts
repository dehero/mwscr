import { dataManager } from '../../../scripts/data-managers/manager.js';
import { getUsersPageData } from '../../components/UsersPage/UsersPage.data.js';

export const data = () => getUsersPageData(dataManager);
