import { usePageContext } from 'vike-solid/usePageContext';

export function useParams<TParams extends object>() {
  const context = usePageContext();

  return () => context.routeParams as TParams;
}
