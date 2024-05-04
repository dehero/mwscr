/* @refresh reload */
import './index.css';
import { Router } from '@solidjs/router';
import { render } from 'solid-js/web';
import { routes } from './routes/index.js';

const root = document.querySelector('#root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

const cleanup = render(() => <Router children={routes} />, root!);

if (import.meta.hot) {
  import.meta.hot.dispose(cleanup);
}
