import vike from 'vike/plugin';
import vikeSolid from 'vike-solid/vite';
import { defineConfig } from 'vite';
import { imagetools } from 'vite-imagetools';
import multiplePublicDirPlugin from 'vite-multiple-assets';
import { dataExtractorPlugin } from './src/local/vite-plugins/data-extractor-plugin.js';
import { importYamlPlugin } from './src/local/vite-plugins/import-yaml-plugin.js';

export default defineConfig(({ isSsrBuild }) => ({
  root: 'src/site',
  plugins: [
    imagetools(),
    importYamlPlugin(),
    dataExtractorPlugin(),
    // TODO: add sitemap after https://github.com/vikejs/vike/issues/1451 gets resolved
    vike({ prerender: true, trailingSlash: true }),
    vikeSolid(),
    multiplePublicDirPlugin(['assets', 'src/site/public'], {
      ssr: isSsrBuild,
    }),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    outDir: '../../dist',
    // Leave CSS code split enabled for consistent CSS chunk hashes
    // cssCodeSplit: false,
    emptyOutDir: true,
    minify: true,
  },
}));
