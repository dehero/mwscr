import { navigate } from 'vike/client/router';
import { usePageContext } from 'vike-solid/usePageContext';
import { unknownToString } from '../../core/utils/common-utils.js';

export function useSearchParams<TSearchParams extends object>(): [
  TSearchParams,
  (searchParams: Partial<Record<keyof TSearchParams, unknown>>) => void,
] {
  const searchParams = usePageContext().urlParsed.search as TSearchParams;
  // const searchParams = window ? Object.fromEntries(new URL(window.location.href).searchParams.entries()) : {};

  const setSearchParams = (value: Partial<Record<keyof TSearchParams, unknown>>) => {
    const url = new URL(window.location.href);
    Object.entries(value).forEach(([key, value]) => {
      const valueStr = unknownToString(value);
      if (valueStr) {
        url.searchParams.set(key, valueStr);
      } else {
        url.searchParams.delete(key);
      }
    });
    // @ts-expect-error No proper type for `navigate`
    navigate(url.pathname + url.search, { overwriteLastHistoryEntry: true });
  };

  return [searchParams, setSearchParams];
}
