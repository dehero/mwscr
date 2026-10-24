import clsx from 'clsx';
import { For, Show } from 'solid-js';
import type { Option } from '../../../core/entities/option.ts';
import { localize } from '../../utils/intl-utils.ts';
import { Frame } from '../Frame/Frame.tsx';
import styles from './RadioGroup.module.css';
import { Select } from '../Select/Select.tsx';

export interface RadioGroupProps<T> {
  class?: string;
  options: Option<T>[];
  name: string;
  onChange: (value: T | undefined) => void;
  value?: T | undefined;
  selectThreshold?: number;
}

export function RadioGroup<T extends string>(props: RadioGroupProps<T>) {
  return (
    <Show
      when={!props.selectThreshold || props.options.length <= props.selectThreshold}
      fallback={<Select<T> {...props} />}
    >
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
              <span class={styles.optionLabel}>{localize(option.label) || option.value?.toString() || ''}</span>
            </Frame>
          )}
        </For>
      </div>
    </Show>
  );
}
