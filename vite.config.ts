import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/law-firm-management/',
  build: {
    outDir: 'dist',  // Specify the output directory
    assetsDir: 'assets',  // Specify assets directory
  },
  plugins: [vue()]
});