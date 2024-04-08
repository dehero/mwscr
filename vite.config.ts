import yamlPlugin from '@modyfi/vite-plugin-yaml';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
// TODO: move schema outside data-managers
import { YAML_SCHEMA } from './src/data-managers/utils/yaml.js';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  root: 'src/site',
  plugins: [solidPlugin(), yamlPlugin({ schema: YAML_SCHEMA })],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    outDir: '../../dist',
  },
});
