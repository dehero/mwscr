import type { PageContext } from 'vike/types';
import { useRouteInfo } from '../hooks/useRouteInfo.js';

export default function title(pageContext: PageContext) {
  const { meta } = useRouteInfo(pageContext);

  return [meta().title, 'Morrowind Screenshots'].filter(Boolean).join(' — ');
}
