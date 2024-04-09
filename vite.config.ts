import yamlPlugin from '@modyfi/vite-plugin-yaml';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import solidPlugin from 'vite-plugin-solid';
// TODO: move schema outside data-managers
import { YAML_SCHEMA } from './src/data-managers/utils/yaml.js';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  root: 'src/site',
  plugins: [
    solidPlugin(),
    yamlPlugin({ schema: YAML_SCHEMA }),
    // TODO: don't use node's built-in modules for cross-platform code
    nodePolyfills({ include: ['path', 'url'] }),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    outDir: '../../dist',
  },
});
