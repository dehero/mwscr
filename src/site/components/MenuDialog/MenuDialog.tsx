import { For } from 'solid-js';
import type { Option } from '../../../core/entities/option.ts';
import { texts } from '../../texts/index.ts';
import { localize } from '../../utils/intl-utils.ts';
import { Button } from '../Button/Button.tsx';
import { Dialog } from '../Dialog/Dialog.tsx';
import styles from './MenuDialog.module.css';

export interface MenuDialogProps {
  title: string;
  show: boolean;
  options: Option<string>[];
  value?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function MenuDialog(props: MenuDialogProps) {
  return (
    <Dialog
      title={props.title}
      show={props.show}
      modal
      onClose={props.onClose}
      contentClass={styles.container}
      actions={<Button onClick={props.onClose}>{localize(texts.common.close)}</Button>}
    >
      <For each={props.options}>
        {(option) => {
          const selected = () => option.value === props.value;

          return (
            <Button
              class={styles.item}
              active={selected()}
              state={selected() ? 'selected' : undefined}
              onClick={(e: Event) => {
                e.preventDefault();
                if (option.value) {
                  props.onSelect(option.value);
                }
              }}
            >
              {localize(option.label) || option.value?.toString() || ''}
            </Button>
          );
        }}
      </For>
    </Dialog>
  );
}
