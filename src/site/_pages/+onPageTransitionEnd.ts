import type { OnPageTransitionEndAsync } from 'vike/types';

export const onPageTransitionEnd: OnPageTransitionEndAsync = async (): ReturnType<OnPageTransitionEndAsync> => {
  document.dispatchEvent(new Event('pagetransitionend'));
};
