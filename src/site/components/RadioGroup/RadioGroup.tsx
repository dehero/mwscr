import clsx from 'clsx';
import { For } from 'solid-js';
import type { Option } from '../../../core/entities/option.js';
import { Frame } from '../Frame/Frame.js';
import styles from './RadioGroup.module.css';

export interface RadioGroupProps<T> {
  class?: string;
  options: Option<T>[];
  name: string;
  onChange?: (value: T | undefined) => void;
  value?: T | undefined;
}

export function RadioGroup<T extends string>(props: RadioGroupProps<T>) {
  return (
    <div class={clsx(styles.container, props.class)}>
      <For each={props.options}>
        {(option) => (
          <Frame component="label" variant="button" class={styles.option} tabIndex={0}>
            <input
              type="radio"
              value={option.value ?? ''}
              name={props.name}
              checked={props.value === option.value}
              onChange={(e) => props.onChange?.((e.target.value || undefined) as T | undefined)}
              class={styles.radio}
            />
            <span class={styles.optionLabel}>{option.label || option.value}</span>
          </Frame>
        )}
      </For>
    </div>
  );
}
