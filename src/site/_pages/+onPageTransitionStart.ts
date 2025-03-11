import type { OnPageTransitionStartAsync } from 'vike/types';

export const onPageTransitionStart: OnPageTransitionStartAsync = async (): ReturnType<OnPageTransitionStartAsync> => {
  document.dispatchEvent(new Event('pagetransitionstart'));
};
