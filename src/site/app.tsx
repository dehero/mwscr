import { MetaProvider } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { Suspense } from 'solid-js';
import { Page } from './components/Page/Page.js';

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Page>
            <Suspense>{props.children}</Suspense>
          </Page>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
