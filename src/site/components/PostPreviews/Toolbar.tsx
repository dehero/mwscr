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
  const withActions = () => props.actions && props.actions.length > 0;

  return (
    <div class={clsx(styles.toolbar, withActions() && styles.withActions, props.class)}>
      <Show when={withActions()}>
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
      <p class={styles.label}>{props.label}</p>
    </div>
  );
};
