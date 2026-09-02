import { type Component, Show } from 'solid-js';
import { uploadFiles } from '../../../core/data-managers/uploads-manager.js';
import { stripCommonExtension } from '../../../core/utils/string-utils.js';
import { getResourceDataUrl } from '../../data-managers/resources.js';
import { texts } from '../../texts/index.js';
import { localize } from '../../utils/intl-utils.js';
import { Button } from '../Button/Button.jsx';
import { createDetachedDialogFragment } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import type { DialogProps } from '../Dialog/Dialog.jsx';
import { Dialog } from '../Dialog/Dialog.jsx';
import type { ImageEditorRef } from '../ImageEditor/ImageEditor.jsx';
import { ImageEditor } from '../ImageEditor/ImageEditor.jsx';
import { useToaster } from '../Toaster/Toaster.jsx';
import styles from './ImageEditingDialog.module.css';

interface ImageEditingDialogProps extends Omit<DialogProps, 'title' | 'modal' | 'contentClass' | 'actions'> {
  url: string;
  onConfirm: (newUrl: string) => void;
}

export const ImageEditingDialog: Component<ImageEditingDialogProps> = (props) => {
  let editorRef: ImageEditorRef | undefined;

  const { addToast } = useToaster();

  const dataUrl = () => getResourceDataUrl(props.url);

  const handleConfirm = async () => {
    if (!editorRef?.hasChanges()) {
      addToast(localize(texts.editing.noChangesToSave));
      return;
    }

    try {
      const dataUrl = editorRef.getResultDataUrl();
      if (!dataUrl) {
        throw new Error('Unable to get data URL.');
      }

      let [, basename] = props.url.split(/\/([^\/]+)$/);
      if (basename) {
        basename = `${stripCommonExtension(basename)}`;
      } else {
        basename = 'edited';
      }

      const filename = `${basename}.png`;

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: blob.type });

      const { errors, uploads } = await uploadFiles([file], { originalUrl: props.url });
      if (errors.length > 0) {
        for (const error of errors) {
          addToast(error);
        }
        return;
      }

      const [upload] = uploads;
      if (!upload) {
        return;
      }

      props.onConfirm(upload.url);
    } catch (error) {
      if (error instanceof Error) {
        addToast(`Failed to save edited image: ${error.message}`);
      }
    }
  };

  const handleClick = () => {
    props.onClose();
  };

  return (
    <Dialog
      {...props}
      title={localize(texts.component.editImage)}
      actions={[
        <Button onClick={handleConfirm}>{localize(texts.common.ok)}</Button>,
        <Button onClick={props.onClose}>{localize(texts.common.cancel)}</Button>,
      ]}
      modal
      class={styles.dialog}
      contentClass={styles.container}
    >
      <Show
        when={dataUrl()}
        fallback={
          <div class={styles.fallbackWrapper}>
            <p class={styles.fallback}>
              {localize(texts.editing.noResourceAccess, {
                setting: (parts) => (
                  <a
                    href={createDetachedDialogFragment('contributing', 'settings')}
                    class={styles.link}
                    onClick={handleClick}
                  >
                    {parts}
                  </a>
                ),
              })}
            </p>
          </div>
        }
      >
        <ImageEditor url={dataUrl()} ref={(ref) => (editorRef = ref)} />
      </Show>
    </Dialog>
  );
};
