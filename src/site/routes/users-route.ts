import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import type { UsersPageData } from '../pages/UsersPage/UsersPage.data.js';
import { getUsersPageData } from '../pages/UsersPage/UsersPage.data.js';
import { UsersPage, type UsersPageSearchParams } from '../pages/UsersPage/UsersPage.jsx';

export interface UsersRouteParams extends SiteRouteParams, UsersPageSearchParams {}

export const usersRoute: SiteRoute<UsersRouteParams, UsersPageData> = {
  path: '/users',
  info: () => ({
    title: 'Members',
    description: 'List of members of Morrowind Screenshots project.',
  }),
  createUrl: (params) => {
    const searchParams = new URLSearchParams(
      Object.entries(params).filter((item): item is [string, string] => typeof item[1] === 'string'),
    );

    return `/users/${searchParams.size > 0 ? '?' : ''}${searchParams.toString()}`;
  },
  getData: getUsersPageData,
  component: UsersPage,
};
