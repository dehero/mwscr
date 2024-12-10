import path from 'path';
import fastGlob from 'fast-glob';
import { load } from 'js-yaml';
import vike from 'vike/plugin';
import vikeSolid from 'vike-solid/vite';
import { defineConfig } from 'vite';
import { imagetools } from 'vite-imagetools';
import multiplePublicDirPlugin from 'vite-multiple-assets';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import pkg from './package.json';
import { YAML_SCHEMA } from './src/local/data-managers/utils/yaml.js';
import { dataExtractorPlugin } from './src/local/vite-plugins/data-extractor-plugin.js';

export default defineConfig(({ isSsrBuild }) => ({
  root: 'src/site',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify('version' in pkg ? pkg.version : 'unknown'),
  },
  plugins: [
    imagetools(),
    dataExtractorPlugin(),
    // TODO: add sitemap after https://github.com/vikejs/vike/issues/1451 gets resolved
    vike({ prerender: true, trailingSlash: true }),
    vikeSolid(),
    multiplePublicDirPlugin(['assets', 'src/site/public'], {
      ssr: isSsrBuild,
    }),
    viteStaticCopy({
      targets: [
        {
          src: '../../data/**/*.yml',
          dest: 'data',
          transform: (content, filename) =>
            JSON.stringify(
              load(content, {
                filename,
                schema: YAML_SCHEMA,
                onWarning: (warning) => console.warn(warning.toString()),
              }),
            ),
          rename: (_fileName, _fileExtension, fullPath) => path.relative('./data', fullPath).replace(/.yml$/, '.json'),
        },
        {
          src: '../../data/**/*.yml',
          dest: 'data',
          transform: async () =>
            JSON.stringify(
              (await fastGlob.glob('**/*.yml', { cwd: './data' })).map((filename) =>
                filename.replace(/.yml$/, '.json'),
              ),
            ),
          rename: 'index.json',
        },
      ],
    }),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    outDir: '../../dist',
    cssCodeSplit: false,
    emptyOutDir: true,
    minify: true,
  },
}));
