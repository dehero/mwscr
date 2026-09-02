import clsx from 'clsx';
import type { Component } from 'solid-js';
import { createEffect, createSignal } from 'solid-js';
import { useSettings } from '../../hooks/useSettings.js';
import { siteStore } from '../../stores/index.js';
import { texts } from '../../texts/index.js';
import { localize } from '../../utils/intl-utils.js';
import { Button } from '../Button/Button.jsx';
import { Input } from '../Input/Input.jsx';
import { Label } from '../Label/Label.jsx';
import { useToaster } from '../Toaster/Toaster.jsx';
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
      await siteStore.setSecretKey(value);
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
