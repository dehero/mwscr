import type { RouteDefinition } from '@solidjs/router';
import { About } from './components/About/About.jsx';
import { Contributing } from './components/Contributing/Contributing.jsx';
import { Posts } from './components/Posts/Posts.jsx';

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
