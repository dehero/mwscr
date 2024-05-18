import { contributingRoute } from './contributing-route.js';
import { homeRoute } from './home-route.js';
import { inboxRoute } from './inbox-route.js';
import { postRoute } from './post-route.js';
import { publishedRoute } from './published-route.js';
import { trashRoute } from './trash-route.js';
import { userRoute } from './user-route.js';
import { usersRoute } from './users-route.js';

export const routes = [
  homeRoute,
  contributingRoute,
  publishedRoute,
  inboxRoute,
  trashRoute,
  postRoute,
  usersRoute,
  userRoute,
];
