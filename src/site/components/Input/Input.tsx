import { debounce } from '@solid-primitives/scheduled';
import clsx from 'clsx';
import type { Component, JSX } from 'solid-js';
import { createEffect, createSignal, Show } from 'solid-js';
import { Frame } from '../Frame/Frame.js';
import styles from './Input.module.css';

export interface InputProps {
  class?: string;
  name?: string;
  onChange?: (value: string) => void;
  onDebouncedChange?: (value: string) => void;
  onBlur?: JSX.FocusEventHandlerUnion<HTMLInputElement | HTMLTextAreaElement, FocusEvent>;
  value?: string;
  multiline?: boolean;
  readonly?: boolean;
  rows?: number | string;
}

export const Input: Component<InputProps> = (props) => {
  const [localValue, setLocalValue] = createSignal<string>(props.value || '');

  const debouncedChange = debounce((value: string) => props.onDebouncedChange?.(value), 800);

  const handleInput = (value: string) => {
    setLocalValue(value);
    props.onChange?.(value);
    if (props.onDebouncedChange) {
      debouncedChange(value);
    }
  };

  createEffect(() => setLocalValue(props.value || ''));

  return (
    <Show
      when={props.multiline}
      fallback={
        <Frame<'input'>
          component="input"
          class={clsx(styles.input, props.class)}
          name={props.name}
          onInput={(e) => handleInput(e.target.value)}
          onBlur={props.onBlur}
          value={localValue()}
          readonly={props.readonly}
        />
      }
    >
      <Frame<'textarea'>
        component="textarea"
        class={clsx(styles.input, styles.textarea, props.class)}
        name={props.name}
        rows={props.rows}
        onInput={(e) => handleInput(e.target.value)}
        onBlur={props.onBlur}
        value={localValue()}
        readonly={props.readonly}
      />
    </Show>
  );
};
