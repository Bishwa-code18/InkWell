import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// NOTE: Vite 8 uses rolldown which requires manualChunks as a function, not an object.
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,           // never expose source in production
    chunkSizeWarningLimit: 800, // TipTap + GSAP + OGL are large — suppress false warnings
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
          if (id.includes('@tiptap')) {
            return 'vendor-editor';
          }
          if (id.includes('@reduxjs') || id.includes('react-redux')) {
            return 'vendor-state';
          }
        },
      },
    },
  },
})
