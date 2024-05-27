import type { Component, JSX } from 'solid-js';
import { createContext, createEffect, createSignal, For, useContext } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Frame } from '../Frame/Frame.js';
import styles from './Toaster.module.css';

export interface ToasterContext {
  addToast: (message: string, duration?: number) => string;
  removeToast: (id: string) => void;
}

export const ToasterContext = createContext<ToasterContext>({ addToast: () => '', removeToast: () => {} });

export const useToaster = () => useContext(ToasterContext);

export interface Toast {
  id: string;
  message: string;
}

export interface ToastProps {
  message: string;
  show: boolean;
}

export interface ToasterProps {
  children?: JSX.Element;
}

export const Toaster: Component<ToasterProps> = (props) => {
  const [toasts, setToasts] = createSignal<Toast[]>();

  const addToast = (message: string, duration = 3000) => {
    const id = Math.random().toString();
    setToasts([...(toasts() ?? []), { id, message }]);
    if (duration > 0 && duration !== Infinity) {
      setTimeout(() => removeToast(id), duration);
    }
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(toasts()?.filter((toast) => toast.id !== id));
  };

  return (
    <ToasterContext.Provider value={{ addToast, removeToast }}>
      {props.children}
      <Portal>
        <div class={styles.container}>
          <For each={toasts()}>{(toast) => <Frame class={styles.item}>{toast.message}</Frame>}</For>
        </div>
      </Portal>
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
      setToastId(addToast(props.message));
    }
  });

  return null;
};
