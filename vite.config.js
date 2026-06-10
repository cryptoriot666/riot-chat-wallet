import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/app/',
  optimizeDeps: {
    include: ['@mysten/sui'],
    esbuildOptions: { target: 'es2020', format: 'esm' }
  },
  build: {
    outDir: 'dist/app',
    commonjsOptions: { transformMixedEsModules: true, include: [/node_modules/] },
    rollupOptions: {
      external: ['@mysten-incubation/memwal','node-fetch','cross-fetch','fs','url','path']
    }
  },
  resolve: { mainFields: ['module', 'main'] }
})
