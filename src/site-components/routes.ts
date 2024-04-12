import type { RouteDefinition } from '@solidjs/router';
import { About } from './About/About.js';
import { Contributing } from './Contributing/Contributing.js';
import { Posts } from './Posts/Posts.js';

export interface RouteInfo {
  label: string;
  title?: string;
}

export const routes: RouteDefinition[] = [
  {
    path: '/',
    component: About,
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
  {
    path: '/contributing/',
    component: Contributing,
    info: {
      label: 'Contributing',
    },
  },
];
