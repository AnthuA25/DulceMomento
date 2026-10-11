import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/DulceMomento/' : '/',
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('dompurify')) return 'editor'
        },
      },
    },
  },
  test: { environment: 'node', include: ['tests/**/*.test.ts'], testTimeout: 60000 },
})
