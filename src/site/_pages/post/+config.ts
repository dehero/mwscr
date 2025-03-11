import type { Config } from 'vike/types';
import { PostPage } from '../../components/PostPage/PostPage.jsx';
import { postRoute } from '../../routes/post-route.js';

const config: Config = {
  route: postRoute.path,
  Page: PostPage,
};

export default config;
