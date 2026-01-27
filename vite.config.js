import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    // Handle SPA routing - redirect all routes to index.html
    historyApiFallback: true
  },
  appType: 'spa',
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild'
  }
})
