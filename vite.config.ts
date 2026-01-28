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
import { createTopicEntryFromMarkdown } from './src/core/entities/topic.js';
import { dataManager } from './src/scripts/data-managers/manager.js';
import { YAML_SCHEMA } from './src/scripts/data-managers/utils/yaml.js';
import { getConstantRedirects } from './src/scripts/utils/vite-utils.js';

export default defineConfig(async ({ isSsrBuild }) => ({
  root: 'src/site',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify('version' in pkg ? pkg.version : 'unknown'),
  },
  plugins: [
    imagetools(),
    // TODO: add sitemap after https://github.com/vikejs/vike/issues/1451 gets resolved
    vike({
      prerender: true,
      trailingSlash: true,
      redirects: Object.fromEntries(await getConstantRedirects()),
    }),
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
          src: '../../data/**/*.md',
          dest: 'data',
          transform: (content, filename) =>
            JSON.stringify(Object.fromEntries([createTopicEntryFromMarkdown(content, filename)])),
          rename: (_fileName, _fileExtension, fullPath) => path.relative('./data', fullPath).replace(/.md$/, '.json'),
        },
        {
          src: '../../data/**/*.{yml,md}',
          dest: 'data',
          transform: async () =>
            JSON.stringify(
              (await fastGlob.glob('**/*.{yml,md}', { cwd: './data' })).map((filename) =>
                filename.replace(/.(yml|md)$/, '.json'),
              ),
            ),
          rename: 'index.json',
        },
        {
          src: '../../data/**/*.yml',
          dest: 'data',
          transform: async () => JSON.stringify(await dataManager.getAllTagInfos()),
          rename: 'tag-infos.json',
        },
        {
          src: '../../data/locations.yml',
          dest: 'data',
          transform: async () => JSON.stringify(await dataManager.getAllLocationInfos()),
          rename: 'location-infos.json',
        },
        {
          src: '../../data/users.yml',
          dest: 'data',
          transform: async () => JSON.stringify(await dataManager.getAllUserInfos()),
          rename: 'user-infos.json',
        },
        ...PostsManagerName.options.map((name) => ({
          src: `../../data/${name}/*.yml`,
          dest: `data/${name}`,
          transform: async () => JSON.stringify(await dataManager.getAllPostInfos(name)),
          rename: `infos.json`,
        })),
        {
          src: `../../data/topics/*.md`,
          dest: `data/topics`,
          transform: async () => JSON.stringify(await dataManager.getAllTopicInfos()),
          rename: `infos.json`,
        },
        {
          src: 'public/.htaccess',
          dest: '',
          transform: async (content) => {
            const redirects = [...(await getConstantRedirects())].map(([from, to]) => `Redirect 301 ${from} ${to}`);
            return `${redirects.join('\n')}\n\n${content}`;
          },
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
