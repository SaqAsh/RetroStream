import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    target: 'es2020',
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  // Suppress CJS deprecation warning
  esbuild: {
    target: 'es2020'
  },
});
