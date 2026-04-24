import type { JSX } from 'solid-js';
import { Frame } from '../../components/Frame/Frame.jsx';
import { ImageEditor } from '../../components/ImageEditor/ImageEditor.jsx';
import styles from './ImageEditorPage.module.css';

export const ImageEditorPage = (): JSX.Element => {
  return (
    <Frame class={styles.container}>
      <ImageEditor />
    </Frame>
  );
};

export default ImageEditorPage;
