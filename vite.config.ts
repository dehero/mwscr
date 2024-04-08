import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  root: 'src/site',
  plugins: [solidPlugin()],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    outDir: '../../dist',
  },
});
