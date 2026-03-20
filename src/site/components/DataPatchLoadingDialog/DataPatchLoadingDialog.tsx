import { createEffect } from 'solid-js';
import { useDataPatchManager } from '../DataPatchManager/DataPatchManager.jsx';
import type { DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';

export const DataPatchLoadingDialog: DetachedDialog = (props) => {
  const { loadPatch, patches } = useDataPatchManager();

  createEffect(async () => {
    if (!props.show || !patches()) {
      return;
    }

    if (props.pathname) {
      await loadPatch(props.pathname);
    }

    props.onClose();
  });

  return <></>;
};
