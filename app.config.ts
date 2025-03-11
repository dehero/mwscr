import { defineConfig } from '@solidjs/start/config';
import { imagetools } from 'vite-imagetools';
// import multiplePublicDirPlugin from 'vite-multiple-assets';
// import { dataExtractorPlugin } from './src/local/vite-plugins/data-extractor-plugin.js';
// import { importYamlPlugin } from './src/local/vite-plugins/import-yaml-plugin.js';

export default defineConfig({
  ssr: false,
  appRoot: './src/site',
  routeDir: './pages',
  server: {
    output: { dir: 'dist', serverDir: 'dist/server', publicDir: 'dist/client' },
    publicAssets: [
      {
        baseURL: '/',
        dir: 'assets',
        // maxAge: 60 * 60 * 24 * 7, // 7 days
      },
      {
        baseURL: '/',
        dir: 'src/site/public',
        // maxAge: 60 * 60 * 24 * 7, // 7 days
      },
    ],
    prerender: {
      routes: ['/'],
    },
  },
  vite: {
    plugins: [
      imagetools(),
      // importYamlPlugin(),
      // dataExtractorPlugin(),
      //   multiplePublicDirPlugin(['assets', 'src/site/public']),
    ],
  },
});
