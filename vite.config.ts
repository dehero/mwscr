import remarkGfm from 'remark-gfm';
import vike from 'vike/plugin';
import vikeSolid from 'vike-solid/vite';
import { defineConfig } from 'vite';
// import faviconPlugin from 'vite-plugin-favicons-inject';
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
    importYamlPlugin(),
    vike({ prerender: true, trailingSlash: true }),
    vikeSolid({
      extensions: ['.mdx', '.md'],
    }),
    //   faviconPlugin('./assets/icon.png', {
    //     appName: 'Morrowind Screenshots',
    //     appShortName: 'mwscr',
    //     appDescription:
    //       'Original screenshots and videos from The Elder Scrolls III: Morrowind. No third-party mods. No color filters. No interface.',
    //     developerName: 'dehero',
    //     developerURL: 'https://github.com/dehero',
    //     background: '#000',
    //     theme_color: '#000',
    //   }),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    outDir: '../../dist',
    cssCodeSplit: false,
    emptyOutDir: true,
  },
});
