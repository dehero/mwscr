import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import type { UsersPageData } from '../components/UsersPage/UsersPage.data.js';
import { getUsersPageData } from '../components/UsersPage/UsersPage.data.js';
import type { UsersPageSearchParams } from '../components/UsersPage/UsersPage.js';

export interface UsersRouteParams extends SiteRouteParams, UsersPageSearchParams {}

export const usersRoute: SiteRoute<UsersRouteParams, UsersPageData> = {
  path: '/users',
  meta: () => ({
    title: 'Users',
    description: 'List of users of Morrowind Screenshots project.',
  }),
  createUrl: (params) => {
    const searchParams = new URLSearchParams(
      Object.entries(params).filter((item): item is [string, string] => typeof item[1] === 'string'),
    );

    return `/users/${searchParams.size > 0 ? '?' : ''}${searchParams.toString()}`;
  },
  getData: getUsersPageData,
};
