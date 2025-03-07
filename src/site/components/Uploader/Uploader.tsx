import type { UploadFile } from '@solid-primitives/upload';
import {
  // createDropzone,
  createFileUploader,
} from '@solid-primitives/upload';
import type { Component } from 'solid-js';
import { USER_UNKNOWN } from '../../../core/entities/user.js';
import { dateToString } from '../../../core/utils/date-utils.js';
import { dataManager } from '../../data-managers/manager.js';
import { uploadFiles } from '../../data-managers/uploads.js';
import { Button } from '../Button/Button.jsx';
import { useToaster } from '../Toaster/Toaster.jsx';

export interface UploaderProps {
  //   dropzoneRef: HTMLElement;
}

export const Uploader: Component<UploaderProps> = () => {
  const { addToast } = useToaster();

  const { selectFiles } = createFileUploader({ accept: 'image/png', multiple: true });
  //   const { setRef: dropzoneRef } = createDropzone({ onDrop: processUploadFiles });

  const processUploadFiles = async (items: UploadFile[]) => {
    if (items.length === 0) {
      addToast('No files selected for upload');
    }

    const inbox = dataManager.findPostsManager('inbox');
    const result = await uploadFiles(items.map((item) => item.file));

    for (const error of result.errors) {
      addToast(error);
    }

    for (const [i, upload] of result.uploads.entries()) {
      const id = `${USER_UNKNOWN}.${dateToString(new Date(), true)}${i > 0 ? i + 1 : ''}`;
      await inbox?.addItem({ content: upload.url, title: upload.name, type: 'shot', author: USER_UNKNOWN }, id);

      addToast(`"${upload.name}" added to Inbox`);
    }
  };

  const handleUpload = async () => {
    selectFiles(processUploadFiles);
  };

  return <Button onClick={handleUpload}>Upload</Button>;
};
