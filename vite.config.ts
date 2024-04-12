import yamlPlugin from '@modyfi/vite-plugin-yaml';
import remarkGfm from 'remark-gfm';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import plainTextPlugin from 'vite-plugin-plain-text';
import solidPlugin from 'vite-plugin-solid';
// @ts-expect-error No proper typing
import solidMarkdownPlugin from 'vite-plugin-solid-markdown';
// TODO: move schema outside data-managers
import { YAML_SCHEMA } from './src/data-managers/utils/yaml.js';
// @ts-expect-error No proper typing
// eslint-disable-next-line import/extensions
import { remarkLinkRewrite } from './src/utils/remark-plugin.js';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  root: 'src/site-components',
  publicDir: '../../assets',
  plugins: [
    solidMarkdownPlugin({
      remarkPlugins: [
        remarkGfm,
        [
          remarkLinkRewrite,
          {
            wrapperClasses: '.markdown',
            replacer: (url: string) => {
              return url
                .replace('assets/', '/')
                .replace('docs/', '/')
                .replace(/\.md$/, '/')
                .replace(/\/index\/$/, '/')
                .toLowerCase();
            },
          },
        ],
      ],
    }),
    solidPlugin({
      extensions: ['.mdx', '.md'],
    }),
    yamlPlugin({ schema: YAML_SCHEMA }),
    // TODO: don't use node's built-in modules for cross-platform code
    nodePolyfills({ include: ['path', 'url'] }),
    // @ts-expect-error No proper typing
    plainTextPlugin(['**/*.lst'], { namedExport: false }),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    outDir: '../../dist',
  },
});
