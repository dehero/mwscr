import type { JSX } from 'solid-js';
import { Frame } from '../Frame/Frame.jsx';
import ImageEditor from '../ImageEditor/ImageEditor.jsx';
import styles from './ImageEditorPage.module.css';

export const ImageEditorPage = (): JSX.Element => {
  return (
    <Frame class={styles.container}>
      <ImageEditor />
    </Frame>
  );
};
