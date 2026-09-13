import { defineConfig } from 'vite';

const basePath = process.env.VITE_BASE_PATH?.replace(/\/?$/, '/');

export default defineConfig({
  base: basePath ?? '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
