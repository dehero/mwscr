import type { Config } from 'vike/types';
import { UsersPage } from '../../components/UsersPage/UsersPage.js';
import { usersRoute } from '../../routes/users-route.js';

const config: Config = {
  route: usersRoute.path,
  Page: UsersPage,
};

export default config;
