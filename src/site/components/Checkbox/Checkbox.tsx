import clsx from 'clsx';
import type { Component, JSX } from 'solid-js';
import { createEffect, Show } from 'solid-js';
import { Frame } from '../Frame/Frame.js';
import styles from './Checkbox.module.css';

export interface CheckboxProps {
  class?: string;
  name: string;
  value: boolean | undefined;
  onChange: (value: boolean | undefined) => void;
  tristate?: boolean;
  trueLabel?: string;
  falseLabel?: string;
}

export const Checkbox: Component<CheckboxProps> = (props) => {
  let inputRef: HTMLInputElement | undefined;

  createEffect(() => {
    if (props.tristate && inputRef) {
      inputRef.indeterminate = typeof props.value === 'undefined';
    }
  });

  const handleChange: JSX.ChangeEventHandlerUnion<HTMLInputElement, Event> = (e) => {
    if (props.tristate) {
      const value = typeof props.value === 'undefined' ? true : e.target.checked ? undefined : false;
      if (inputRef) {
        inputRef.indeterminate = typeof value === 'undefined';
      }
      props.onChange(value);
    } else {
      props.onChange(e.target.checked);
    }
  };

  return (
    <Frame component="label" variant="button" class={clsx(styles.checkbox, props.class)} tabIndex={0}>
      <input
        type="checkbox"
        name={props.name}
        checked={typeof props.value === 'undefined' ? false : props.value}
        onChange={handleChange}
        class={styles.input}
        ref={inputRef}
      />

      <Show
        when={props.tristate}
        fallback={
          <>
            <span class={clsx(styles.label, styles.labelChecked)}>{props.trueLabel || 'On'}</span>
            <span class={clsx(styles.label, styles.labelNotChecked)}>{props.falseLabel || 'Off'}</span>
          </>
        }
      >
        <span class={clsx(styles.label, styles.labelIndeterminate)}>Off</span>
        <span class={clsx(styles.label, styles.labelChecked)}>{props.trueLabel || 'Yes'}</span>
        <span class={clsx(styles.label, styles.labelNotChecked)}>{props.falseLabel || 'No'}</span>
      </Show>
    </Frame>
  );
};
