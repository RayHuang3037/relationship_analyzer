import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' 让构建产物用相对路径，放到 GitHub Pages 的任何子路径下都能跑
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 3000 },
  build: { outDir: 'dist', sourcemap: false }
})
