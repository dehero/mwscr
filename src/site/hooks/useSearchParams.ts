import type { Accessor } from 'solid-js';
import { createMemo, createSignal, onMount } from 'solid-js';
import { unknownToString } from '../../core/utils/common-utils.js';
import { useLocation, useNavigate } from '@solidjs/router';

export function useSearchParams<TSearchParams extends object>(): [
  Accessor<TSearchParams>,
  (searchParams: Partial<Record<keyof TSearchParams, unknown>>) => void,
] {
  const navigate = useNavigate();
  const location = useLocation();

  const [mounted, setMounted] = createSignal(false);
  const searchParams = createMemo(() => (mounted() ? location.search : {}) as TSearchParams);

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

    navigate(url.pathname + url.search + url.hash, { replace: true });
  };

  return [searchParams, setSearchParams];
}
