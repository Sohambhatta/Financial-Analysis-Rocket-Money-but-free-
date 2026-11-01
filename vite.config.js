import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from a GitHub Pages project site, so assets must be requested
  // under the repo name instead of the domain root.
  base: '/Financial-Analysis-Rocket-Money-but-free-/',
  plugins: [react(), tailwindcss()],
})
