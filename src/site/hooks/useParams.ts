import { usePageContext } from 'vike-solid/usePageContext';
import { resolveFirstRoute } from '../routes/index.js';

export function useParams<TParams extends object>() {
  const location = usePageContext().urlParsed;
  const current = () => resolveFirstRoute(location.pathname);

  return () => current().params as TParams;
}
