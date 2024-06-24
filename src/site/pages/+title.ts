import type { PageContext } from 'vike/types';
import { useRouteInfo } from '../hooks/useRouteInfo.js';

export default function title(pageContext: PageContext) {
  const routeInfo = useRouteInfo(pageContext);

  return [routeInfo?.title, 'Morrowind Screenshots'].filter(Boolean).join(' — ');
}
