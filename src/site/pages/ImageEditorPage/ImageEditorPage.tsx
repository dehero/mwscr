import type { JSX } from 'solid-js';
import { AppPage } from '../../components/App/App.jsx';
import { Frame } from '../../components/Frame/Frame.jsx';
import { ImageEditor } from '../../components/ImageEditor/ImageEditor.jsx';
import { texts } from '../../texts/index.js';
import { localize } from '../../utils/intl-utils.js';
import styles from './ImageEditorPage.module.css';

export const ImageEditorPage = (): JSX.Element => {
  return (
    <>
      <AppPage
        title={localize(texts.app.imageEditor)}
        description={localize(texts.app.imageEditorDescription)}
        loading={false}
      />

      <Frame class={styles.container}>
        <ImageEditor />
      </Frame>
    </>
  );
};

export default ImageEditorPage;
