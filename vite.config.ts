import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/kanaflip/',
  plugins: [react()],
  build: {
    outDir: 'dist/kanaflip',
    emptyOutDir: true,
  },
  test: { environment: 'jsdom', globals: true },
})
