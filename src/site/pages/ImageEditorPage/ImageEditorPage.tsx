import type { JSX } from 'solid-js';
import { AppPage } from '../../components/App/App.jsx';
import { Frame } from '../../components/Frame/Frame.jsx';
import { ImageEditor } from '../../components/ImageEditor/ImageEditor.jsx';
import styles from './ImageEditorPage.module.css';

export const ImageEditorPage = (): JSX.Element => {
  return (
    <>
      <AppPage title="Image Editor" description="Image editor for Morrowind Screenshots project." loading={false} />

      <Frame class={styles.container}>
        <ImageEditor />
      </Frame>
    </>
  );
};

export default ImageEditorPage;
