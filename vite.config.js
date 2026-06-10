import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  optimizeDeps: {
    include: ['@mysten/sui'],
    esbuildOptions: { target: 'es2020', format: 'esm' }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: { main: './index.html' }
    }
  },
  resolve: { mainFields: ['module', 'main'] }
})
