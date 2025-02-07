import clsx from 'clsx';
import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';
import type { Action } from '../../../core/utils/common-types.js';
import { Button } from '../Button/Button.js';
import styles from './PostPreviews.module.css';

export interface ToolbarProps {
  label?: string;
  actions?: Action[];
  class?: string;
}

export const Toolbar: Component<ToolbarProps> = (props) => {
  return (
    <div class={clsx(styles.toolbar, props.class)}>
      <p class={styles.label}>{props.label}</p>
      <Show when={props.actions}>
        <div class={styles.actions}>
          <For each={props.actions}>
            {(action) => (
              <Button href={action.url} onClick={action.onExecute}>
                {action.label}
              </Button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};
