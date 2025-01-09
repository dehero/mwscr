import { dataManager } from '../../../local/data-managers/manager.js';
import { getUsersPageData } from '../../components/UsersPage/UsersPage.data.js';

export const data = () => getUsersPageData(dataManager);
