import type { Component } from 'solid-js';
import {
  //createResource,
  createSignal,
  // Show
} from 'solid-js';
import { Button } from '../Button/Button.jsx';
import type { DialogProps } from '../Dialog/Dialog.jsx';
import { Dialog } from '../Dialog/Dialog.jsx';
import { Input } from '../Input/Input.jsx';
import { Label } from '../Label/Label.jsx';
import styles from './DataPatchSaveDialog.module.css';
// import { OptionSelectButton } from '../OptionSelectButton/OptionSelectButton.jsx';
// import { UserTooltip } from '../UserTooltip/UserTooltip.jsx';
// import { dataManager } from '../../data-managers/manager.js';
// import { EMPTY_OPTION, Option } from '../../../core/entities/option.js';
// import { Toast } from '../Toaster/Toaster.jsx';
// import { UserPreview } from '../UserPreview/UserPreview.jsx';

// async function getUserOptions(): Promise<Option[]> {
//   return [
//     EMPTY_OPTION,
//     ...(await dataManager.getAllUserInfos())
//       .map((info) => ({ label: info.title, value: info.id, image: info.avatar }))
//       .sort((a, b) => a.label.localeCompare(b.label)),
//   ];
// }

export interface DataPatchSaveParams {
  title: string;
  author?: string;
}

export interface DataPatchSaveDialogProps extends Omit<DialogProps, 'title' | 'modal' | 'class' | 'actions'> {
  onConfirm: (params: DataPatchSaveParams) => void;
}

export const DataPatchSaveDialog: Component<DataPatchSaveDialogProps> = (props) => {
  const [title, setTitle] = createSignal('');

  // const [email, setEmail] = createSignal('');
  // const [author, setAuthor] = createSignal<string>();
  // const [userInfo] = createResource(author, (member) => dataManager.getUserInfo(member));
  // const [userOptions] = createResource(() => props.show, getUserOptions);

  const handleConfirm = () => {
    props.onConfirm({
      title: title(),
      //author: email()
    });
  };

  return (
    <>
      {/* <Toast message={`Loading Members`} show={props.show && userOptions.loading} loading /> */}

      <Dialog
        {...props}
        // show={props.show && !userOptions.loading}
        title="Save Patch"
        modal
        onClose={props.onClose}
        contentClass={styles.content}
        actions={[<Button onClick={handleConfirm}>OK</Button>, <Button onClick={props.onClose}>Cancel</Button>]}
      >
        <Label label="Title" vertical>
          <Input value={title()} onChange={setTitle} class={styles.inputBoxInput} />
        </Label>
        {/* 
        <Label label="Author" vertical>
          <Show when={userInfo()}>{(userInfo) => <UserPreview userInfo={userInfo()} />}</Show>
        </Label>

        <OptionSelectButton
          title="Select Author"
          emptyLabel="Select"
          options={userOptions() ?? []}
          value={author()}
          onChange={(author) => setAuthor(author)}
          optionTooltip={(value, forRef) => <UserTooltip forRef={forRef} user={value} showAvatar />}
        />

        <Show when={!author()}>
          <Label label="E-mail" labelClass={styles.labelWithFixedWidth}>
            <Input name="email" value={email()} onChange={setEmail} class={styles.inputBoxInput} />
          </Label>
        </Show>
        */}
      </Dialog>
    </>
  );
};
