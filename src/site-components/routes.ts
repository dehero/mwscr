import type { RouteDefinition } from '@solidjs/router';
import { Posts } from './Posts/Posts.js';

export interface RouteInfo {
  label: string;
  title?: string;
}

export const routes: RouteDefinition[] = [
  {
    path: '/',
    info: {
      label: 'Home',
    },
  },
  {
    path: '/published/',
    component: Posts,
    info: {
      label: 'Published',
    },
  },
];
