import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import type { UsersPageSearchParams } from '../components/UsersPage/UsersPage.js';

export interface UsersRouteParams extends SiteRouteParams, UsersPageSearchParams {}

export const usersRoute: SiteRoute<UsersRouteParams> = {
  path: '/users',
  info: () => ({
    title: 'Users',
    description: 'List of users of Morrowind Screenshots project.',
  }),
  createUrl: (params) => {
    const searchParams = new URLSearchParams(
      Object.entries(params).filter((item): item is [string, string] => typeof item[1] === 'string'),
    );

    return `/users/${searchParams.size > 0 ? '?' : ''}${searchParams.toString()}`;
  },
};
