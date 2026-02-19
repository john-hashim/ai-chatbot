import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  // Build mode: "embed" builds the script tag IIFE, default builds the iframe page
  const isEmbedBuild = process.env.BUILD_TARGET === 'embed'

  if (isEmbedBuild) {
    return {
      plugins: [preact()],
      build: {
        lib: {
          entry: resolve(__dirname, 'src/embed.tsx'),
          name: 'AIChatbotEmbed',
          formats: ['iife'],
          fileName: () => 'embed.js',
        },
        outDir: 'dist',
        emptyOutDir: false,
        cssCodeSplit: false,
        minify: true,
      },
    }
  }

  // Default: iframe build
  return {
    plugins: [preact()],
    base: '/embed-assets/',
    build: {
      rollupOptions: {
        input: {
          iframe: resolve(__dirname, 'iframe.html'),
        },
      },
      outDir: 'dist',
      emptyOutDir: true,
      minify: true,
    },
  }
})
