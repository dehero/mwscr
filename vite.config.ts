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
import { PostsManagerName } from './src/core/entities/posts-manager.js';
import { dataExtractor } from './src/local/data-managers/extractor.js';
import { YAML_SCHEMA } from './src/local/data-managers/utils/yaml.js';

export default defineConfig(({ isSsrBuild }) => ({
  root: 'src/site',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify('version' in pkg ? pkg.version : 'unknown'),
  },
  plugins: [
    imagetools(),
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
        {
          src: '../../data/locations.yml',
          dest: 'data',
          transform: async () => JSON.stringify(await dataExtractor.getAllLocationInfos()),
          rename: 'location-infos.json',
        },
        {
          src: '../../data/users.yml',
          dest: 'data',
          transform: async () => JSON.stringify(await dataExtractor.getAllUserInfos()),
          rename: 'user-infos.json',
        },
        ...PostsManagerName.options.map((name) => ({
          src: `../../data/${name}/*.yml`,
          dest: `data/${name}`,
          transform: async () => JSON.stringify(await dataExtractor.getAllPostInfos(name)),
          rename: `infos.json`,
        })),
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
