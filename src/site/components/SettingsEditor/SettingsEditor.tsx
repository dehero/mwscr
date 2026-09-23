import clsx from 'clsx';
import type { Component } from 'solid-js';
import { createEffect, createSignal } from 'solid-js';
import { useSettings } from '../../hooks/useSettings.ts';
import { s3Store } from '../../stores/index.ts';
import { texts } from '../../texts/index.ts';
import { localize } from '../../utils/intl-utils.ts';
import { Button } from '../Button/Button.tsx';
import { Input } from '../Input/Input.tsx';
import { Label } from '../Label/Label.tsx';
import { useToaster } from '../Toaster/Toaster.tsx';
import styles from './SettingsEditor.module.css';

export interface SettingsEditorProps {
  class?: string;
}

export const SettingsEditor: Component<SettingsEditorProps> = (props) => {
  const { addToast } = useToaster();
  const [localSecretKey, setLocalSecretKey] = createSignal<string>();
  const { secretKey } = useSettings();

  const handleSecretKeyValidate = async () => {
    try {
      const value = localSecretKey();
      await s3Store.setSecretKey(value);
      if (value) {
        addToast(localize(texts.editing.secretKeySet));
      } else {
        addToast(localize(texts.editing.secretKeyCleared));
      }
    } catch (error) {
      if (error instanceof Error) {
        addToast(error.message);
      }
      setLocalSecretKey('');
    }
  };

  createEffect(() => {
    setLocalSecretKey(secretKey());
  });

  return (
    <div class={clsx(styles.container, props.class)}>
      <Label label={localize(texts.editing.editorsKey)} vertical>
        <fieldset class={styles.fieldset}>
          <Input value={localSecretKey()} onChange={setLocalSecretKey} type="password" />
          <Button onClick={handleSecretKeyValidate}>{localize(texts.editing.validateEditorsKey)}</Button>
        </fieldset>

        <p class={styles.hint}>{localize(texts.editing.editorKeyHint)}</p>
      </Label>
    </div>
  );
};
