import type { Accessor, Component, JSX, Resource } from 'solid-js';
import { batch, createContext, createMemo, createResource, createSignal, useContext } from 'solid-js';
import { dataPatchToString, stringToDataPatch } from '../../../core/entities/data-patch.js';
import type { Upload } from '../../../core/entities/upload.js';
import { getUploadUrl } from '../../../core/entities/upload.js';
import { stripCommonExtension } from '../../../core/utils/string-utils.js';
import { dataManager } from '../../data-managers/manager.js';
import { getUploads, uploadFiles } from '../../data-managers/uploads.js';
import { useLocalPatch } from '../../hooks/useLocalPatch.js';
import { Toast, useToaster } from '../Toaster/Toaster.jsx';

export interface PatchManagerContext {
  saveLocalPatch: () => Promise<boolean>;
  clearLocalPatch: () => Promise<boolean>;
  loadPatch: (name: string) => Promise<boolean>;
  patches: Resource<Map<string, Upload>>;
  selectedPatch: Accessor<Upload | undefined>;
}

export const PatchManagerContext = createContext<PatchManagerContext>();

export const usePatchManager = () => {
  const context = useContext(PatchManagerContext);
  if (!context) {
    throw new Error('usePatchManager must be used within a PatchManager provider');
  }
  return context;
};

export interface PatchManagerProps {
  children?: JSX.Element;
}

export const PatchManager: Component<PatchManagerProps> = (props) => {
  const { addToast, messageBox, inputBox } = useToaster();

  const [localPatchSize, localPatchName] = useLocalPatch();
  const [processingMessage, setProcessingMessage] = createSignal<string>();

  const [patches, { refetch: refetchPatches }] = createResource(
    async () => new Map([...(await getUploads({ type: 'patch' }))].map((upload) => [upload.name, upload])),
  );

  const selectedPatch = createMemo(() => {
    return patches()?.get(localPatchName());
  });

  const loadPatch = async (name: string) => {
    const uploads = patches();
    if (!uploads) {
      return false;
    }

    const upload = uploads.get(name);
    if (!upload) {
      return false;
    }

    const title = stripCommonExtension(upload.originalName);

    try {
      setProcessingMessage(`Loading patch "${title}"`);

      const url = getUploadUrl(upload);
      const response = await fetch(url);
      const data = stringToDataPatch(await response.text());

      setProcessingMessage(undefined);

      if (!selectedPatch() && localPatchSize() > 0) {
        const result = await messageBox('Would you like to save your local edits?', ['Yes', 'No']);
        if (result === 0) {
          const uploaded = await saveLocalPatch();
          if (!uploaded) {
            return false;
          }
        }
      }

      setProcessingMessage(`Loading patch "${title}"`);

      batch(() => {
        dataManager.clearPatch();
        dataManager.mergePatch(data);
      });

      setProcessingMessage(undefined);

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

    const title = await inputBox('Patch Name');
    if (!title) {
      return false;
    }

    const patch = dataManager.getPatch();
    const data = dataPatchToString(patch, true);
    const blob = new Blob([data], { type: 'application/json' });
    const file = new File([blob], `${title}.json`);

    try {
      setProcessingMessage(`Saving patch "${title}"`);

      const result = await uploadFiles([file]);

      for (const error of result.errors) {
        addToast(error);
      }

      await refetchPatches();

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : `${error}`;
      addToast(`Failed to save patch "${title}": ${message}`);
    } finally {
      setProcessingMessage(undefined);
    }

    return false;
  };

  const clearLocalPatch = async () => {
    if (localPatchSize() === 0) {
      return true;
    }

    if (!selectedPatch()) {
      const result = await messageBox('Are you sure you want to clear local edits?', ['Yes', 'No']);
      if (result !== 0) {
        return false;
      }
    }

    setProcessingMessage(`Clearing local edits`);
    dataManager.clearPatch();
    setProcessingMessage(undefined);

    return true;
  };

  return (
    <PatchManagerContext.Provider value={{ patches, selectedPatch, saveLocalPatch, loadPatch, clearLocalPatch }}>
      <Toast message={processingMessage() ?? ''} show={Boolean(processingMessage())} loading />

      {props.children}
    </PatchManagerContext.Provider>
  );
};
