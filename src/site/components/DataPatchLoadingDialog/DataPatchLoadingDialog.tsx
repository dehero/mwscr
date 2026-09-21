import { createEffect } from 'solid-js';
import { useDataPatchManager } from '../DataPatchManager/DataPatchManager.tsx';
import type { DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.tsx';

const DataPatchLoadingDialog: DetachedDialog = (props) => {
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

export { DataPatchLoadingDialog };
export default DataPatchLoadingDialog;
