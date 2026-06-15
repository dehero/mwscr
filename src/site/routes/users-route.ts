import { lazy } from 'solid-js';
import type { SiteRoute } from '../../core/entities/site-route.js';
import { queryUsersPageData, type UsersPageData, type UsersPageParams } from '../pages/UsersPage/UsersPage.data.js';

export const usersRoute: SiteRoute<UsersPageParams, UsersPageData> = {
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
  component: lazy(() => import('../pages/UsersPage/UsersPage.jsx')),
  preload: ({ params }) => queryUsersPageData(params),
};
