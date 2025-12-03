import type { Accessor } from 'solid-js';
import { createMemo, createSignal, onMount } from 'solid-js';
import { navigate } from 'vike/client/router';
import { usePageContext } from 'vike-solid/usePageContext';
import { unknownToString } from '../../core/utils/common-utils.js';

export function useSearchParams<TSearchParams extends object>(): [
  Accessor<TSearchParams>,
  (searchParams: Partial<Record<keyof TSearchParams, unknown>>) => void,
] {
  const [mounted, setMounted] = createSignal(false);
  const searchParams = createMemo(() => (mounted() ? usePageContext().urlParsed.search : {}) as TSearchParams);

  onMount(() => setMounted(true));

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
    navigate(url.pathname + url.search + url.hash, { overwriteLastHistoryEntry: true });
  };

  return [searchParams, setSearchParams];
}
