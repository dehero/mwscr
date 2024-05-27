import type { PageContext } from 'vike/types';

export default function title(pageContext: PageContext) {
  return [pageContext.routeInfo?.title, 'Morrowind Screenshots'].filter(Boolean).join(' — ');
}
