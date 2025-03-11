import type { Config } from 'vike/types';
import { PostsPage } from '../../components/PostsPage/PostsPage.jsx';
import { postsRoute } from '../../routes/posts-route.js';

const config: Config = {
  route: postsRoute.path,
  Page: PostsPage,
};

export default config;
