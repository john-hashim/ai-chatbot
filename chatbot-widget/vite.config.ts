import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    cors: true,
  },
  build: {
    // Output directory
    outDir: 'dist',

    // Generate sourcemaps for debugging
    sourcemap: false,

    // Minify for production
    minify: 'terser',

    // Optimize chunks
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
        },
        // Asset file names
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },

    // Target modern browsers for smaller bundle
    target: 'es2015',

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios'],
  },
})
