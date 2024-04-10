import yamlPlugin from '@modyfi/vite-plugin-yaml';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import plainTextPlugin from 'vite-plugin-plain-text';
import solidPlugin from 'vite-plugin-solid';
// TODO: move schema outside data-managers
import { YAML_SCHEMA } from './src/data-managers/utils/yaml.js';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  root: 'src/site-components',
  plugins: [
    solidPlugin(),
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
