import { usePageContext } from 'vike-solid/usePageContext';
import { useRouteInfo } from '../hooks/useRouteInfo.js';

export default function Head() {
  const pageContext = usePageContext();
  const routeInfo = useRouteInfo(pageContext);

  return (
    <>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#000000" />
      <meta
        name="description"
        content={
          routeInfo?.description ||
          'Original screenshots and videos from The Elder Scrolls III: Morrowind. No third-party mods. No color filters. No interface.'
        }
      />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
    </>
  );
}
