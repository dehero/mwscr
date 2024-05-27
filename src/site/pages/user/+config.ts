import type { Config } from 'vike/types';
import { UserPage } from '../../components/UserPage/UserPage.js';
import { userRoute } from '../../routes/user-route.js';

const config: Config = {
  route: userRoute.path,
  Page: UserPage,
};

export default config;
