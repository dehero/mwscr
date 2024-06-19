import iconUrl from '../../../assets/icon.png';
import { useRouteInfo } from '../hooks/useRouteInfo.js';

export default function Head() {
  const routeInfo = useRouteInfo();

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
      <link rel="icon" href={iconUrl} />
    </>
  );
}
