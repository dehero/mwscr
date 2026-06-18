import { createEffect, onCleanup, onMount } from 'solid-js';
import { isServer } from 'solid-js/web';
import { useLocation } from '@solidjs/router';

const COUNTER_ID = 97623848;
const SCRIPT_SRC = 'https://mc.yandex.ru/metrika/tag.js';
const WATCH_URL = `https://mc.yandex.ru/watch/${COUNTER_ID}`;

type YmMethod = 'init' | 'hit' | 'reachGoal' | 'params';

type Ym = {
  (id: number, method: YmMethod, ...args: unknown[]): void;
  a?: unknown[][];
  l?: number;
};

declare global {
  interface Window {
    ym?: Ym;
  }
}

let isInitialized = false;
let lastTrackedUrl: string | undefined;

const ensureYm = (): Ym | undefined => {
  if (isServer) {
    return undefined;
  }

  if (window.ym) {
    return window.ym;
  }

  const ym = ((...args: unknown[]) => {
    ym.a ??= [];
    ym.a.push(args);
  }) as Ym;

  ym.l = Date.now();
  window.ym = ym;

  return ym;
};

const loadScript = () => {
  if (isServer) {
    return;
  }

  if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = SCRIPT_SRC;
  document.head.append(script);
};

const scheduleWhenIdle = (callback: () => void) => {
  if (isServer) {
    return () => undefined;
  }

  if (window.requestIdleCallback) {
    const handle = window.requestIdleCallback(callback, { timeout: 2000 });
    return () => window.cancelIdleCallback?.(handle);
  }

  const timeoutId = window.setTimeout(callback, 1500);
  return () => window.clearTimeout(timeoutId);
};

const callYm = (method: YmMethod, ...args: unknown[]) => {
  ensureYm()?.(COUNTER_ID, method, ...args);
};

const buildRouteUrl = (pathname: string, search: string, hash: string) => {
  if (isServer) {
    return undefined;
  }

  return new URL(`${pathname}${search}${hash}`, window.location.origin).toString();
};

export const hitYandexMetrika = (url: string, referer?: string) => {
  if (isServer) {
    return;
  }

  callYm('hit', url, {
    referer: referer ?? lastTrackedUrl ?? document.referrer,
    title: document.title,
  });

  lastTrackedUrl = url;
};

export const reachYandexMetrikaGoal = (target: string, params?: Record<string, unknown>) => {
  callYm('reachGoal', target, params);
};

export const setYandexMetrikaParams = (params: Record<string, unknown>) => {
  callYm('params', params);
};

export function YandexMetrikaCounter() {
  const location = useLocation();
  const currentUrl = () => buildRouteUrl(location.pathname, location.search, location.hash);

  onMount(() => {
    if (isServer || isInitialized) {
      return;
    }

    callYm('init', {
      defer: true,
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
    });

    isInitialized = true;

    const cancelIdle = scheduleWhenIdle(loadScript);

    onCleanup(cancelIdle);
  });

  createEffect(() => {
    const url = currentUrl();
    if (!url || url === lastTrackedUrl) {
      return;
    }

    queueMicrotask(() => {
      hitYandexMetrika(url);
    });
  });

  return (
    <noscript>
      <div>
        <img src={WATCH_URL} style={{ position: 'absolute', left: '-9999px' }} alt="" />
      </div>
    </noscript>
  );
}
