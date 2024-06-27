import type { OnHydrationEndAsync } from 'vike/types';

export { onHydrationEnd };

const onHydrationEnd: OnHydrationEndAsync = async (): ReturnType<OnHydrationEndAsync> => {
  document.dispatchEvent(new Event('hydrationend'));
};
