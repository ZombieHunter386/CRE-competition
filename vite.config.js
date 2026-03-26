import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Only use base path for production builds (GitHub Pages)
  base: command === 'build' ? '/CRE-competition/' : '/',
}))
