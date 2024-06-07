import { usePageContext } from 'vike-solid/usePageContext';

export function useParams<TParams extends object>() {
  return () => usePageContext().routeParams as TParams;
}
