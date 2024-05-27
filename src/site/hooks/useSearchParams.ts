import { navigate } from 'vike/client/router';
import { usePageContext } from 'vike-solid/usePageContext';

export function useSearchParams<TSearchParams extends object>(): [
  TSearchParams,
  (searchParams: Partial<TSearchParams>) => void,
] {
  const searchParams = usePageContext().urlParsed.search as TSearchParams;
  // const searchParams = window ? Object.fromEntries(new URL(window.location.href).searchParams.entries()) : {};

  const setSearchParams = (value: Partial<TSearchParams>) => {
    const url = new URL(window.location.href);
    Object.entries(value).forEach(([key, value]) =>
      value ? url.searchParams.set(key, String(value)) : url.searchParams.delete(key),
    );
    // @ts-expect-error No proper type for `navigate`
    navigate(url.pathname + url.search, { overwriteLastHistoryEntry: true });
  };

  return [searchParams, setSearchParams];
}
