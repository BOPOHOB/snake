import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src/front',
    },
  },
  build: {
    outDir: isSsrBuild ? 'dist/server' : 'dist/client',
    emptyOutDir: !isSsrBuild,
    ...(isSsrBuild
      ? {
          rollupOptions: {
            input: 'src/front/entry.server.tsx',
            output: {
              entryFileNames: 'entry-server.js',
              format: 'esm',
            },
          },
        }
      : {}),
  },
  ssr: {
    // Bundle deps so Deno can import a single ESM file without node_modules resolution
    noExternal: true,
    target: 'webworker',
  },
  css: {
    preprocessorOptions: {
      less: {
        additionalData: `@bgColor: #73a582;\n@fgColor: #000000;\n`,
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
      '/og': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
}));
