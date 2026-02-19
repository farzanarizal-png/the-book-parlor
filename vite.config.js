// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 1. Ensure this is imported

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 2. Ensure this is in the list
  ],
})