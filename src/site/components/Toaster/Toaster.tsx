import { ReactiveMap } from '@solid-primitives/map';
import type { Component, JSX } from 'solid-js';
import { createContext, createEffect, createSignal, createUniqueId, For, onCleanup, Show, useContext } from 'solid-js';
import { isServer } from 'solid-js/web';
import { Button } from '../Button/Button.jsx';
import { Dialog } from '../Dialog/Dialog.js';
import { Frame } from '../Frame/Frame.js';
import { Input } from '../Input/Input.jsx';
import { Label } from '../Label/Label.jsx';
import { Loader } from '../Loader/Loader.js';
import styles from './Toaster.module.css';

export interface ToasterContext {
  addToast: (message: string, duration?: number, loading?: boolean) => string;
  removeToast: (id: string) => void;
  messageBox: (message: string, buttons: string[]) => Promise<number>;
  inputBox: (label: string, value?: string) => Promise<string | undefined>;
  modal: <T>(component: (resolve: (value: T) => void) => JSX.Element) => Promise<T>;
}

export const ToasterContext = createContext<ToasterContext>({
  addToast: () => '',
  removeToast: () => {},
  messageBox: () => Promise.resolve(-1),
  inputBox: () => Promise.resolve(undefined),
  modal: () => Promise.resolve(undefined as never),
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

interface MessageBoxProps {
  message: string;
  buttons: string[];
}

interface InputBoxProps {
  label: string;
  value?: string;
}

interface ModalInstance<T> {
  id: string;
  component: (resolve: (value: T) => void) => JSX.Element;
  resolve: (value: T) => void;
}

function createToastId() {
  return Math.random().toString();
}

export const Toaster: Component<ToasterProps> = (props) => {
  let messageBoxResolve: ((value: number | PromiseLike<number>) => void) | undefined;
  let inputBoxResolve: ((value: string | PromiseLike<string> | undefined) => void) | undefined;

  const toasts = new ReactiveMap<string, Toast>(props.initialToasts?.filter(([, props]) => props.show) || []);
  const [toastIdsWaitingForAnimationEnd, setToastIdsWaitingForAnimationEnd] = createSignal<string[]>([]);
  const [isAnimatingLoader, setIsAnimatingLoader] = createSignal(true);
  const [messageBoxProps, setMessageBoxProps] = createSignal<MessageBoxProps | undefined>();
  const [inputBoxProps, setInputBoxProps] = createSignal<InputBoxProps | undefined>();
  const [modalInstances, setModalInstances] = createSignal<ModalInstance<unknown>[]>([]);

  const [inputBoxValue, setInputBoxValue] = createSignal('');

  const addToast = (message: string, duration = 5000, loading = false) => {
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

  const messageBox = (message: string, buttons: string[]): Promise<number> => {
    setMessageBoxProps({ message, buttons });
    return new Promise<number>((resolve) => {
      messageBoxResolve = resolve;
    });
  };

  const inputBox = (label: string, value?: string): Promise<string | undefined> => {
    setInputBoxProps({ label });
    setInputBoxValue(value ?? '');
    return new Promise<string | undefined>((resolve) => {
      inputBoxResolve = resolve;
    });
  };

  const modal = <T,>(component: (resolve: (value: T) => void) => JSX.Element): Promise<T> => {
    const id = createUniqueId();

    return new Promise<T>((resolve) => {
      const instance: ModalInstance<T> = {
        id,
        component: () =>
          component((value: T) => {
            setModalInstances((prev) => prev.filter((inst) => inst.id !== id));
            resolve(value);
          }),
        resolve,
      };

      setModalInstances((prev) => [...prev, instance as ModalInstance<unknown>]);
    });
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

  const handleMessageBoxButtonClick = (index: number) => {
    messageBoxResolve?.(index);
    messageBoxResolve = undefined;
    setMessageBoxProps(undefined);
  };

  const handleInputBoxButtonClick = (result: boolean) => {
    const value = inputBoxValue();
    if (result && !inputBoxValue()) {
      addToast(`Fill ${inputBoxProps()?.label}`);
      return;
    }
    inputBoxResolve?.(result ? value : undefined);
    inputBoxResolve = undefined;
    setInputBoxProps(undefined);
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

  onCleanup(() => {
    modalInstances().forEach((instance) => {
      instance.resolve(undefined);
    });
  });

  return (
    <ToasterContext.Provider value={{ addToast, removeToast, messageBox, inputBox, modal }}>
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

      <Dialog
        modal
        show={Boolean(messageBoxProps())}
        onClose={() => handleMessageBoxButtonClick(-1)}
        class={styles.messageBox}
        actions={messageBoxProps()?.buttons.map((text, index) => (
          <Button onClick={() => handleMessageBoxButtonClick(index)}>{text}</Button>
        ))}
      >
        <p class={styles.messageBoxMessage}>{messageBoxProps()?.message}</p>
      </Dialog>

      <Dialog
        modal
        show={Boolean(inputBoxProps())}
        onClose={() => handleMessageBoxButtonClick(-1)}
        class={styles.messageBox}
        actions={[
          <Button onClick={() => handleInputBoxButtonClick(true)}>OK</Button>,
          <Button onClick={() => handleInputBoxButtonClick(false)}>Cancel</Button>,
        ]}
      >
        <Label label={inputBoxProps()?.label} vertical>
          <Input value={inputBoxValue()} onChange={setInputBoxValue} class={styles.inputBoxInput} />
        </Label>
      </Dialog>

      <For each={modalInstances()} fallback={null}>
        {(instance) =>
          // Create component here for right circuit
          instance.component(instance.resolve)
        }
      </For>
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
