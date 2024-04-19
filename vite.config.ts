import remarkGfm from 'remark-gfm';
import { defineConfig } from 'vite';
// @ts-expect-error No proper typing
import faviconPlugin from 'vite-plugin-favicons-inject';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import plainTextPlugin from 'vite-plugin-plain-text';
import solidPlugin from 'vite-plugin-solid';
// @ts-expect-error No proper typing
import solidMarkdownPlugin from 'vite-plugin-solid-markdown';
import { importYamlPlugin } from './src/local/vite-plugins/import-yaml-plugin.js';
// @ts-expect-error No proper typing
// eslint-disable-next-line import/extensions
import { remarkLinkRewrite } from './src/local/vite-plugins/remark-plugin.js';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  root: 'src/site',
  publicDir: '../../assets',
  plugins: [
    faviconPlugin('./assets/icon.png', {
      appName: 'Morrowind Screenshots',
      appShortName: 'mwscr',
      appDescription:
        'Original screenshots and videos from The Elder Scrolls III: Morrowind. No third-party mods. No color filters. No interface.',
      developerName: 'dehero',
      developerURL: 'https://github.com/dehero',
      background: '#000',
      theme_color: '#000',
    }),
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
    importYamlPlugin(),
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
