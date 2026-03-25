import type { Config } from 'vike/types';
import { ImageEditorPage } from '../../components/ImageEditorPage/ImageEditorPage.jsx';
import { imageEditorRoute } from '../../routes/image-editor-route.js';

const config: Config = {
  route: imageEditorRoute.path,
  Page: ImageEditorPage,
};

export default config;
