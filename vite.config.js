import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',  // 改成根路徑
  build: {
    outDir: 'dist'
  }
})
