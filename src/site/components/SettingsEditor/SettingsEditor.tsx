import clsx from 'clsx';
import type { Component } from 'solid-js';
import { createEffect, createSignal } from 'solid-js';
import { useSettings } from '../../hooks/useSettings.js';
import { siteStore } from '../../stores/index.js';
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
        addToast('Secret key successfully tested and set.');
      } else {
        addToast('Secret key cleared.');
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
      <Label label="Editor's Key" vertical>
        <fieldset class={styles.fieldset}>
          <Input value={localSecretKey()} onChange={setLocalSecretKey} type="password" />
          <Button onClick={handleSecretKeyValidate}>Validate</Button>
        </fieldset>

        <p class={styles.hint}>Used by editor to access full size drafts.</p>
      </Label>
    </div>
  );
};
