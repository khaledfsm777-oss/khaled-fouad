import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteSingleFile({
      useRecommendedBuildConfig: true,
      removeViteModuleLoader: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    outDir: 'dist-standalone',
    emptyOutDir: true,
    assetsInlineLimit: 100000000, // 100MB to inline all assets
    chunkSizeWarningLimit: 100000,
  },
});
