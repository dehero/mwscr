import { writeClipboard } from '@solid-primitives/clipboard';
import JsFileDownloader from 'js-file-downloader';
import type { Accessor, Component, JSX, Resource } from 'solid-js';
import { createContext, createMemo, createResource, createSignal, useContext } from 'solid-js';
import { dataPatchToString, getDataPatchName, stringToDataPatch } from '../../../core/entities/data-patch.js';
import type { Upload } from '../../../core/entities/upload.js';
import { dataPatchIssue } from '../../../core/github-issues/data-patch-issue.js';
import { site } from '../../../core/services/site.js';
import { sleep } from '../../../core/utils/common-utils.js';
import { stripCommonExtension } from '../../../core/utils/string-utils.js';
import { dataManager } from '../../data-managers/manager.js';
import { getResourceDataUrl } from '../../data-managers/resources.js';
import { getUploads, uploadFiles } from '../../data-managers/uploads.js';
import { useLocalPatch } from '../../hooks/useLocalPatch.js';
import { DataPatchPreviewDialog } from '../DataPatchPreviewDialog/DataPatchPreviewDialog.jsx';
import type { DataPatchSaveParams } from '../DataPatchSaveDialog/DataPatchSaveDialog.jsx';
import { DataPatchSaveDialog } from '../DataPatchSaveDialog/DataPatchSaveDialog.jsx';
import { Toast, useToaster } from '../Toaster/Toaster.jsx';

export interface DataPatchManagerContext {
  saveLocalPatch: () => Promise<boolean>;
  clearLocalPatch: () => Promise<boolean>;
  exportLocalPatch: () => Promise<boolean>;
  importLocalPatch: (file: File[]) => Promise<boolean>;
  copyLocalPatch: () => boolean;
  submitSelectedPatch: () => Promise<boolean>;
  sharePatch: (meta: Upload) => Promise<boolean>;
  loadPatch: (name: string, skipPatchPreview?: boolean) => Promise<boolean>;
  patches: Resource<Map<string, Upload>>;
  selectedPatch: Accessor<Upload | undefined>;
}

export const DataPatchManagerContext = createContext<DataPatchManagerContext>();

export const useDataPatchManager = () => {
  const context = useContext(DataPatchManagerContext);
  if (!context) {
    throw new Error('useDataPatchManager must be used within a DataPatchManager provider');
  }
  return context;
};

export interface DataPatchManagerProps {
  children?: JSX.Element;
}

export const DataPatchManager: Component<DataPatchManagerProps> = (props) => {
  const { addToast, messageBox, modal } = useToaster();

  const [localPatchSize, localPatchName] = useLocalPatch();
  const [processingMessage, setProcessingMessage] = createSignal<string>();

  const [patches, { refetch: refetchPatches }] = createResource(
    async () => new Map([...(await getUploads({ type: 'patch' }))].map((upload) => [upload.name, upload])),
  );

  const selectedPatch = createMemo(() => {
    const name = localPatchName();
    if (!name) {
      return;
    }
    return patches()?.get(name);
  });

  const loadPatch = async (name: string, skipPatchPreview?: boolean) => {
    const uploads = patches();
    if (!uploads) {
      return false;
    }

    if (name === localPatchName()) {
      await messageBox(`Patch "${stripCommonExtension(selectedPatch()!.originalName)}" is already loaded.`, ['OK']);
      return true;
    }

    const upload = uploads.get(name);
    if (!upload) {
      await messageBox(`Patch "${name}" is wrong or has expired.`, ['OK']);
      return false;
    }

    const title = stripCommonExtension(upload.originalName);

    try {
      setProcessingMessage(`Loading patch "${title}"`);

      const url = getResourceDataUrl(upload.url);
      const response = await fetch(url);
      const data = stringToDataPatch(await response.text());

      setProcessingMessage(undefined);

      if (!skipPatchPreview) {
        const confirmed = await modal((resolve) => (
          <DataPatchPreviewDialog
            onClose={() => resolve(false)}
            onApply={() => resolve(true)}
            meta={upload}
            patch={data}
            show
          />
        ));

        if (!confirmed) {
          return false;
        }
      }

      if (!(await confirmClearingLocalPatch())) {
        return false;
      }

      setProcessingMessage(`Applying patch "${title}"`);

      // Ensure to show message before blocking `replacePatch`
      await sleep(50);

      dataManager.replacePatch(data);

      return true;
    } catch (error) {
      if (error instanceof Error) {
        addToast(`Failed to load patch "${title}": ${error.message}`);
        console.error(error.message);
      } else {
        addToast(`Failed to load patch "${title}": ${error}`);
      }
    } finally {
      setProcessingMessage(undefined);
    }

    return false;
  };

  const saveLocalPatch = async () => {
    if (localPatchSize() === 0) {
      addToast('No edits to save.');
      return false;
    }

    if (selectedPatch()) {
      addToast(`Your edits are already saved as "${stripCommonExtension(selectedPatch()!.originalName)}".`);
      return true;
    }

    const params = await modal<DataPatchSaveParams | undefined>((resolve) => (
      <DataPatchSaveDialog onClose={() => resolve(undefined)} onConfirm={resolve} show />
    ));
    if (!params?.title) {
      return false;
    }

    const patch = dataManager.getPatch();
    const data = dataPatchToString(patch, true);
    const blob = new Blob([data], { type: 'application/json' });
    const file = new File([blob], `${params.title}.json`);

    try {
      setProcessingMessage(`Saving patch "${params.title}"`);

      const result = await uploadFiles([file], params.author);

      for (const error of result.errors) {
        addToast(error);
      }

      await refetchPatches();

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : `${error}`;
      addToast(`Failed to save patch "${params.title}": ${message}`);
    } finally {
      setProcessingMessage(undefined);
    }

    return false;
  };

  const clearLocalPatch = async (skipConfirmation?: boolean) => {
    if (localPatchSize() === 0) {
      return true;
    }

    if (!skipConfirmation) {
      if (!(await confirmClearingLocalPatch())) {
        return false;
      }
    }

    setProcessingMessage(`Clearing local edits`);
    dataManager.clearPatch();
    setProcessingMessage(undefined);

    return true;
  };

  const confirmClearingLocalPatch = async (): Promise<boolean> => {
    if (!selectedPatch() && localPatchSize() > 0) {
      const result = await messageBox('Save your local edits to patch?', ['Yes', 'No', 'Cancel']);
      if (result === 0) {
        const uploaded = await saveLocalPatch();
        if (!uploaded) {
          return false;
        }
      } else if (result === 2) {
        return false;
      }
    }

    return true;
  };

  const exportLocalPatch = async () => {
    if (localPatchSize() === 0) {
      addToast('No edits to export.');
      return false;
    }

    const patch = dataManager.getPatch();
    const data = dataPatchToString(patch);
    const filename = getDataPatchName(patch);

    const blob = new Blob([data], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const downloader = new JsFileDownloader({
      url: href,
      autoStart: false,
      nativeFallbackOnError: true,
      filename,
    });

    try {
      setProcessingMessage(`Exporting edits to "${filename}"`);

      await downloader.start();
      addToast(`Patch "${filename}" exported`);

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : `${error}`;
      addToast(`Failed to export edits: ${message}`);
      return false;
    } finally {
      setProcessingMessage(undefined);
    }
  };

  const importLocalPatch = async (files: File[]) => {
    if (localPatchSize() > 0) {
      const result = await messageBox('Merge selected files with current local edits?', ['Yes', 'No']);
      if (result !== 0) {
        return false;
      }
    }

    let hasSuccess = false;

    for (const file of files) {
      try {
        setProcessingMessage(`Importing edits from "${file.name}"`);

        const data = stringToDataPatch(await file.text());
        dataManager.mergePatch(data);
        hasSuccess = true;
      } catch (error) {
        if (error instanceof Error) {
          addToast(`Failed to import edits from "${file.name}": ${error.message}`);
          console.error(error.message);
        } else {
          addToast(`Failed to import edits from "${file.name}": ${error}`);
        }
      } finally {
        setProcessingMessage(undefined);
      }
    }

    return hasSuccess;
  };

  const copyLocalPatch = () => {
    if (localPatchSize() === 0) {
      addToast('No edits to copy.');
      return false;
    }

    const patch = dataManager.getPatch();
    const data = dataPatchToString(patch);

    writeClipboard(data);
    addToast('Edits copied to clipboard.');

    return true;
  };

  const sharePatch = async (meta: Upload) => {
    const url = site.getDataPatchSharingUrl(meta);

    try {
      // Try to use Web Share API
      if (!navigator.share) {
        throw new Error('Web Share API is not supported');
      }

      await navigator.share({
        title: stripCommonExtension(meta.originalName),
        text: `Check out this data patch: ${url}`,
        url,
      });

      return true;
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        // If Web Share API does not work (not cancelled by user), copy link to clipboard
        await writeClipboard(url);
        addToast('Share link copied to clipboard');
        return true;
      }
    }

    return false;
  };

  const submitSelectedPatch = async () => {
    if (localPatchSize() === 0) {
      addToast('No edits to submit.');
      return false;
    }

    let url = dataPatchIssue.createIssueUrl(dataManager.getPatch(), selectedPatch());
    if (!url) {
      if (!(await saveLocalPatch())) {
        return false;
      }
      url = dataPatchIssue.createIssueUrl(dataManager.getPatch(), selectedPatch());
    }

    if (url) {
      window.open(url, '_blank');
      addToast('Github Issue creation page opened.');

      if (!selectedPatch()) {
        const result = await messageBox(
          'You are supposed to create a GitHub Issue containing your edits. Reset local edits?',
          ['Yes', 'No'],
        );
        if (result === 0) {
          clearLocalPatch(true);
        }
      }

      return true;
    }
    addToast('Failed to generate Github Issue creation url.');

    return false;
  };

  return (
    <DataPatchManagerContext.Provider
      value={{
        patches,
        selectedPatch,
        saveLocalPatch,
        loadPatch,
        clearLocalPatch,
        exportLocalPatch,
        importLocalPatch,
        copyLocalPatch,
        submitSelectedPatch,
        sharePatch,
      }}
    >
      <Toast message={processingMessage() ?? ''} show={Boolean(processingMessage())} loading />

      {props.children}
    </DataPatchManagerContext.Provider>
  );
};
