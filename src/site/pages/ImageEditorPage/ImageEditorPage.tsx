import type { JSX } from 'solid-js';
import { AppPage } from '../../components/App/App.tsx';
import { Frame } from '../../components/Frame/Frame.tsx';
import { ImageEditor } from '../../components/ImageEditor/ImageEditor.tsx';
import { texts } from '../../texts/index.ts';
import { localize } from '../../utils/intl-utils.ts';
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
