import { ReactiveMap } from '@solid-primitives/map';
import type { Component, JSX } from 'solid-js';
import { createContext, createEffect, createSignal, For, onCleanup, Show, useContext } from 'solid-js';
import { isServer } from 'solid-js/web';
import { Frame } from '../Frame/Frame.js';
import { Loader } from '../Loader/Loader.jsx';
import styles from './Toaster.module.css';

export interface ToasterContext {
  addToast: (message: string, duration?: number, loading?: boolean) => string;
  removeToast: (id: string) => void;
}

export const ToasterContext = createContext<ToasterContext>({
  addToast: () => '',
  removeToast: () => {},
});

export const useToaster = () => useContext(ToasterContext);

export interface Toast {
  message: string;
  loading?: boolean;
}

export interface ToastProps extends Toast {
  show: boolean;
}

export interface ToasterProps {
  children?: JSX.Element;
  initialToasts?: Array<[string, ToastProps]>;
}

function createToastId() {
  return Math.random().toString();
}

export const Toaster: Component<ToasterProps> = (props) => {
  const toasts = new ReactiveMap<string, Toast>(props.initialToasts?.filter(([, props]) => props.show) || []);
  const [toastIdsWaitingForAnimationEnd, setToastIdsWaitingForAnimationEnd] = createSignal<string[]>([]);
  const [isAnimatingLoader, setIsAnimatingLoader] = createSignal(true);

  const addToast = (message: string, duration = 3000, loading = false) => {
    const id = createToastId();
    toasts.set(id, { message, loading });
    if (duration > 0 && duration !== Infinity) {
      setTimeout(() => removeToast(id), duration);
    }
    return id;
  };

  const removeToast = (id: string) => {
    if (toasts.get(id)?.loading && isAnimatingLoader()) {
      setToastIdsWaitingForAnimationEnd((ids) => [...ids, id]);
    } else {
      toasts.delete(id);
    }
  };

  const hints = () => [...toasts].filter(([, toast]) => !toast.loading);
  const activeLoaderEntry = () => [...toasts].filter(([, toast]) => toast.loading)[0];

  const handleLoaderAnimationEnd = () => {
    setIsAnimatingLoader(false);

    const ids = toastIdsWaitingForAnimationEnd();
    for (const id of ids) {
      toasts.delete(id);
    }
    setToastIdsWaitingForAnimationEnd([]);
  };

  createEffect(() => {
    const entries = props.initialToasts;

    if (entries) {
      for (const [id, toast] of entries) {
        if (toast.show) {
          toasts.set(id, toast);
        } else {
          removeToast(id);
        }
      }
    }
  });

  return (
    <ToasterContext.Provider value={{ addToast, removeToast }}>
      {props.children}
      <div class={styles.container}>
        <For each={hints()}>{([, toast]) => <Frame class={styles.item}>{toast.message}</Frame>}</For>
        <Show when={activeLoaderEntry()}>
          {(entry) => (
            <Frame variant="thick" class={styles.item}>
              {entry()[1].message}
              <Loader
                initialPercent={isServer ? 50 : 0}
                onAnimationStart={() => {
                  setIsAnimatingLoader(true);
                }}
                onAnimationEnd={handleLoaderAnimationEnd}
              />
            </Frame>
          )}
        </Show>
      </div>
    </ToasterContext.Provider>
  );
};

export const Toast: Component<ToastProps> = (props) => {
  const { addToast, removeToast } = useToaster();
  const [toastId, setToastId] = createSignal<string | undefined>();

  createEffect(() => {
    const id = toastId();
    if (id && !props.show) {
      removeToast(id);
      setToastId(undefined);
    } else if (!id && props.show) {
      setToastId(addToast(props.message, Infinity, props.loading));
    }
  });

  onCleanup(() => {
    const id = toastId();
    if (id) {
      removeToast(id);
    }
  });

  return null;
};
